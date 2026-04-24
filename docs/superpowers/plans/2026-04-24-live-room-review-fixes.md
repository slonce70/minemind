# Live Room Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the three audit findings: validate live-room answer questions, make online room difficulty/settings authoritative, and reduce production dependency audit risk without breaking the Expo 55 stack.

**Architecture:** Keep offline/demo behavior unchanged. Add small shared Edge Function helpers for round-question validation and room settings so server behavior is testable from the existing Node test runner. Persist live-room settings on `rooms` and `round_sessions`, return them through existing contracts, and make the client pass/update settings explicitly instead of relying on local fallback defaults.

**Tech Stack:** Expo 55, React Native, Expo Router, Supabase Edge Functions, PostgreSQL migrations, TypeScript, Node `tsx --test`, npm audit.

---

## File Structure

- Create: `supabase/functions/_shared/round-questions.ts`
  - Pure helpers for validating that an answer belongs to the current round and for filtering legacy invalid submissions during finalization.
- Create: `supabase/functions/_shared/room-settings.ts`
  - Pure helpers for parsing difficulty/settings payloads and normalizing DB room settings.
- Create: `supabase/functions/update-room-settings/index.ts`
  - Host-only Edge Function to persist lobby settings before a round starts.
- Create: `supabase/migrations/20260424_room_settings_and_round_question_guards.sql`
  - Adds room and round settings columns plus a DB-level FK from answer submissions to questions.
- Modify: `supabase/functions/submit-answer/index.ts`
  - Load `question_ids`, reject non-round question ids before upsert, then fetch explanation only from the current round question set.
- Modify: `supabase/functions/finalize-round/index.ts`
  - Filter invalid legacy submissions before scoring and before pending/completed counts.
- Modify: `supabase/functions/_shared/questions.ts`
  - Select packs by locale and canonical difficulty and return pack difficulty metadata.
- Modify: `supabase/functions/_shared/rooms.ts`
  - Select and return room settings metadata from DB.
- Modify: `supabase/functions/create-room/index.ts`
  - Persist requested room settings on creation.
- Modify: `supabase/functions/start-room-round/index.ts`
  - Start rounds from persisted/requested settings and persist round manifest metadata.
- Modify: `supabase/functions/get-room-round/index.ts`
  - Return round settings metadata.
- Modify: `src/features/rooms/live-room-service.ts`
  - Send create/update/start settings and map returned settings without fallback drift.
- Modify: `src/features/rooms/use-room-lobby.ts`
  - Route difficulty changes through the live settings function when online.
- Modify: `app/rooms.tsx`
  - Use the lobby hook's settings selector instead of writing only local state.
- Modify: `src/lib/api-contracts.ts`
  - Keep schemas aligned with canonical live-room settings metadata.
- Modify: `tests/live-room-security.test.ts`
  - Regression tests for the answer question guard and finalization filter.
- Modify: `tests/supabase-room-contracts.test.ts`
  - Regression tests for persisted/returned online difficulty settings.
- Modify: `tests/live-room-lifecycle.test.ts`
  - Source-level regression that start payload includes settings and lobby difficulty selection uses the live settings handler.
- Modify: `package.json` and `package-lock.json`
  - Only if the audit remediation path can update transitive dependencies while preserving Expo 55 validation.

---

## Task 1: Guard Live-Room Answer Submission Against Non-Round Questions

**Files:**
- Create: `supabase/functions/_shared/round-questions.ts`
- Modify: `supabase/functions/submit-answer/index.ts`
- Modify: `supabase/functions/finalize-round/index.ts`
- Test: `tests/live-room-security.test.ts`

- [ ] **Step 1: Write failing tests for round-question guards**

Create `tests/live-room-security.test.ts` with:

```ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  assertQuestionBelongsToRound,
  filterSubmissionsForRoundQuestions,
} from '../supabase/functions/_shared/round-questions.ts';

test('submit-answer guard rejects questions outside the active round', () => {
  assert.doesNotThrow(() =>
    assertQuestionBelongsToRound({
      questionId: 'q-2',
      roundQuestionIds: ['q-1', 'q-2', 'q-3'],
    })
  );

  assert.throws(
    () =>
      assertQuestionBelongsToRound({
        questionId: 'q-outside',
        roundQuestionIds: ['q-1', 'q-2', 'q-3'],
      }),
    /Question does not belong to this round/
  );
});

test('finalize-round ignores legacy submissions for non-round questions', () => {
  const filtered = filterSubmissionsForRoundQuestions(
    [
      { player_id: 'p1', question_id: 'q-1', selected_option: 0, time_left_ms: 1000 },
      { player_id: 'p1', question_id: 'q-outside', selected_option: 1, time_left_ms: 18000 },
      { player_id: 'p2', question_id: 'q-2', selected_option: 2, time_left_ms: 2000 },
    ],
    ['q-1', 'q-2']
  );

  assert.deepEqual(
    filtered.map((entry) => entry.question_id),
    ['q-1', 'q-2']
  );
});

test('edge functions wire the round-question guard before scoring', () => {
  const submitAnswerSource = readFileSync(
    new URL('../supabase/functions/submit-answer/index.ts', import.meta.url),
    'utf8'
  );
  const finalizeRoundSource = readFileSync(
    new URL('../supabase/functions/finalize-round/index.ts', import.meta.url),
    'utf8'
  );

  assert.match(submitAnswerSource, /select\('id, room_id, question_ids'\)/);
  assert.match(submitAnswerSource, /assertQuestionBelongsToRound\(/);
  assert.match(submitAnswerSource, /\.in\('id', round\.question_ids\)/);
  assert.match(finalizeRoundSource, /filterSubmissionsForRoundQuestions\(/);
  assert.match(finalizeRoundSource, /const validSubmissions = /);
  assert.match(finalizeRoundSource, /validSubmissions\.length < expectedSubmissions/);
});
```

- [ ] **Step 2: Run the targeted test and verify it fails**

Run:

```bash
npx tsx --test tests/live-room-security.test.ts
```

Expected: FAIL because `supabase/functions/_shared/round-questions.ts` does not exist.

- [ ] **Step 3: Add the shared round-question guard**

Create `supabase/functions/_shared/round-questions.ts`:

```ts
export type RoundQuestionSubmission = {
  question_id: string;
};

export function assertQuestionBelongsToRound(input: {
  questionId: string;
  roundQuestionIds: string[];
}) {
  if (!input.roundQuestionIds.includes(input.questionId)) {
    throw new Error('Question does not belong to this round.');
  }
}

export function filterSubmissionsForRoundQuestions<TSubmission extends RoundQuestionSubmission>(
  submissions: TSubmission[],
  roundQuestionIds: string[]
) {
  const allowedQuestionIds = new Set(roundQuestionIds);

  return submissions.filter((submission) => allowedQuestionIds.has(submission.question_id));
}
```

- [ ] **Step 4: Wire the guard in `submit-answer`**

Modify `supabase/functions/submit-answer/index.ts`:

```ts
import { assertQuestionBelongsToRound } from '../_shared/round-questions.ts';
```

Change the round lookup:

```ts
const { data: round, error: roundError } = await serviceClient
  .from('round_sessions')
  .select('id, room_id, question_ids')
  .eq('id', body.roundId)
  .single();
```

After membership check and before `sanitizedOption`, add:

```ts
assertQuestionBelongsToRound({
  questionId: body.questionId,
  roundQuestionIds: round.question_ids,
});
```

Change the question lookup:

```ts
const { data: question, error: questionError } = await serviceClient
  .from('questions')
  .select('correct_option, explanation')
  .in('id', round.question_ids)
  .eq('id', body.questionId)
  .single();
```

- [ ] **Step 5: Filter invalid legacy submissions in `finalize-round`**

Modify `supabase/functions/finalize-round/index.ts`:

```ts
import { filterSubmissionsForRoundQuestions } from '../_shared/round-questions.ts';
```

After loading submissions, add:

```ts
const validSubmissions = filterSubmissionsForRoundQuestions(
  submissions ?? [],
  round.question_ids
);
```

Change the scoring loop:

```ts
for (const submission of validSubmissions) {
```

Change the pending check:

```ts
if (validSubmissions.length < expectedSubmissions) {
```

- [ ] **Step 6: Add the DB-level integrity guard**

Create `supabase/migrations/20260424_room_settings_and_round_question_guards.sql` with the answer FK first:

```sql
alter table public.answer_submissions
  add constraint answer_submissions_question_fk
  foreign key (question_id) references public.questions (id) on delete cascade;
```

If the migration already exists by the time this task runs, append this statement only once.

- [ ] **Step 7: Verify the targeted security fix**

Run:

```bash
npx tsx --test tests/live-room-security.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit the security fix**

```bash
git add \
  supabase/functions/_shared/round-questions.ts \
  supabase/functions/submit-answer/index.ts \
  supabase/functions/finalize-round/index.ts \
  supabase/migrations/20260424_room_settings_and_round_question_guards.sql \
  tests/live-room-security.test.ts
git commit -m "fix: guard live room answer questions"
```

---

## Task 2: Persist Canonical Online Room Settings in Supabase

**Files:**
- Create or append: `supabase/migrations/20260424_room_settings_and_round_question_guards.sql`
- Create: `supabase/functions/_shared/room-settings.ts`
- Modify: `supabase/functions/_shared/rooms.ts`
- Modify: `supabase/functions/create-room/index.ts`
- Modify: `src/lib/api-contracts.ts`
- Test: `tests/supabase-room-contracts.test.ts`

- [ ] **Step 1: Write failing contract tests for room settings**

Extend `tests/supabase-room-contracts.test.ts`:

```ts
test('create and join room contracts require canonical room settings metadata', () => {
  const parsed = roomStateSchema.parse({
    contentPackVersion: 'minecraft-v1',
    difficulty: 'hard',
    participants: [],
    questionCount: 8,
    roomCode: 'AB12CD',
    status: 'lobby',
    topicMode: 'mixed',
  });

  assert.equal(parsed.difficulty, 'hard');
  assert.equal(parsed.questionCount, 8);
  assert.equal(parsed.topicMode, 'mixed');
});

test('room shared selector includes settings columns for live rooms', () => {
  const roomHelperSource = readFileSync(
    new URL('../supabase/functions/_shared/rooms.ts', import.meta.url),
    'utf8'
  );
  const createRoomSource = readFileSync(
    new URL('../supabase/functions/create-room/index.ts', import.meta.url),
    'utf8'
  );

  assert.match(roomHelperSource, /content_pack_version/);
  assert.match(roomHelperSource, /difficulty/);
  assert.match(roomHelperSource, /question_count/);
  assert.match(roomHelperSource, /topic_mode/);
  assert.match(createRoomSource, /parseRoomMatchSettingsPayload/);
});
```

Also update the existing imports:

```ts
import { readFileSync } from 'node:fs';
```

- [ ] **Step 2: Run the targeted contract test and verify it fails**

Run:

```bash
npx tsx --test tests/supabase-room-contracts.test.ts
```

Expected: FAIL because `roomStateSchema` does not yet include `questionCount` and `topicMode`, and the Edge Function sources do not include the new helper.

- [ ] **Step 3: Extend the DB migration with room and round settings**

Append to `supabase/migrations/20260424_room_settings_and_round_question_guards.sql`:

```sql
alter table public.rooms
  add column if not exists content_pack_version text not null default 'minecraft-v1',
  add column if not exists difficulty text not null default 'medium',
  add column if not exists question_count integer not null default 8,
  add column if not exists topic_mode text not null default 'mixed';

alter table public.rooms
  drop constraint if exists rooms_difficulty_check,
  drop constraint if exists rooms_question_count_check,
  drop constraint if exists rooms_topic_mode_check;

alter table public.rooms
  add constraint rooms_difficulty_check check (difficulty in ('easy', 'medium', 'hard')),
  add constraint rooms_question_count_check check (question_count = 8),
  add constraint rooms_topic_mode_check check (topic_mode = 'mixed');

alter table public.round_sessions
  add column if not exists content_pack_version text not null default 'minecraft-v1',
  add column if not exists difficulty text not null default 'medium',
  add column if not exists question_count integer not null default 8,
  add column if not exists topic_mode text not null default 'mixed';

alter table public.round_sessions
  drop constraint if exists round_sessions_difficulty_check,
  drop constraint if exists round_sessions_question_count_check,
  drop constraint if exists round_sessions_topic_mode_check;

alter table public.round_sessions
  add constraint round_sessions_difficulty_check check (difficulty in ('easy', 'medium', 'hard')),
  add constraint round_sessions_question_count_check check (question_count = 8),
  add constraint round_sessions_topic_mode_check check (topic_mode = 'mixed');
```

- [ ] **Step 4: Add the shared room settings helper**

Create `supabase/functions/_shared/room-settings.ts`:

```ts
export type ContentDifficulty = 'easy' | 'medium' | 'hard';

export type RoomMatchSettingsPayload = {
  contentPackVersion?: string;
  difficulty?: ContentDifficulty;
  questionCount?: number;
  topicMode?: 'mixed';
};

export type RoomMatchSettings = {
  content_pack_version: string;
  difficulty: ContentDifficulty;
  question_count: 8;
  topic_mode: 'mixed';
};

const difficultyValues = ['easy', 'medium', 'hard'] as const;

function parseDifficulty(value: unknown): ContentDifficulty {
  return difficultyValues.includes(value as ContentDifficulty)
    ? value as ContentDifficulty
    : 'medium';
}

export function parseRoomMatchSettingsPayload(
  payload?: RoomMatchSettingsPayload
): RoomMatchSettings {
  return {
    content_pack_version: payload?.contentPackVersion ?? 'minecraft-v1',
    difficulty: parseDifficulty(payload?.difficulty),
    question_count: 8,
    topic_mode: 'mixed',
  };
}

export function normalizeRoomMatchSettingsRow(row: {
  content_pack_version?: string | null;
  difficulty?: string | null;
  question_count?: number | null;
  topic_mode?: string | null;
}): RoomMatchSettings {
  return {
    content_pack_version: row.content_pack_version ?? 'minecraft-v1',
    difficulty: parseDifficulty(row.difficulty),
    question_count: row.question_count === 8 ? 8 : 8,
    topic_mode: row.topic_mode === 'mixed' ? 'mixed' : 'mixed',
  };
}
```

- [ ] **Step 5: Return settings from the room selector**

Modify `supabase/functions/_shared/rooms.ts` select:

```ts
.select('id, room_code, host_id, status, current_round_id, content_pack_version, difficulty, question_count, topic_mode')
```

- [ ] **Step 6: Persist settings on room creation**

Modify `supabase/functions/create-room/index.ts`:

```ts
import { parseRoomMatchSettingsPayload, type RoomMatchSettingsPayload } from '../_shared/room-settings.ts';
```

Change payload type:

```ts
type CreateRoomPayload = RoomMatchSettingsPayload & {
  locale?: 'en' | 'ru' | 'uk';
};
```

Parse the body:

```ts
const body = await requireJsonBody<CreateRoomPayload>(request);
const settings = parseRoomMatchSettingsPayload(body);
```

Add settings to insert:

```ts
.insert({
  content_pack_version: settings.content_pack_version,
  difficulty: settings.difficulty,
  host_id: user.id,
  question_count: settings.question_count,
  room_code: roomCode,
  status: 'lobby',
  topic_mode: settings.topic_mode,
})
```

Update the select:

```ts
.select('id, room_code, host_id, status, current_round_id, content_pack_version, difficulty, question_count, topic_mode')
```

- [ ] **Step 7: Update client API schemas**

Modify `src/lib/api-contracts.ts`:

```ts
export const roomStateSchema = z.object({
  contentPackVersion: z.string().min(1),
  difficulty: difficultySchema,
  participants: z.array(roomParticipantSchema),
  questionCount: z.literal(8),
  roomCode: z.string().min(1),
  status: roomStatusSchema,
  topicMode: z.literal('mixed'),
});
```

Keep `legacyRoomResponseSchema` as the wire format, but make settings optional there because older deployed functions may not return them during rollout:

```ts
content_pack_version: z.string().nullable().optional(),
difficulty: difficultySchema.optional(),
question_count: z.literal(8).nullable().optional(),
topic_mode: z.enum(['mixed']).nullable().optional(),
```

- [ ] **Step 8: Verify room settings contracts**

Run:

```bash
npx tsx --test tests/supabase-room-contracts.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit room settings persistence**

```bash
git add \
  supabase/migrations/20260424_room_settings_and_round_question_guards.sql \
  supabase/functions/_shared/room-settings.ts \
  supabase/functions/_shared/rooms.ts \
  supabase/functions/create-room/index.ts \
  src/lib/api-contracts.ts \
  tests/supabase-room-contracts.test.ts
git commit -m "feat: persist live room settings"
```

---

## Task 3: Start Online Rounds From Persisted Difficulty and Return Round Metadata

**Files:**
- Modify: `supabase/functions/_shared/questions.ts`
- Modify: `supabase/functions/start-room-round/index.ts`
- Modify: `supabase/functions/get-room-round/index.ts`
- Modify: `src/lib/api-contracts.ts`
- Test: `tests/supabase-room-contracts.test.ts`

- [ ] **Step 1: Write failing tests for round metadata and pack selection**

Extend `tests/supabase-room-contracts.test.ts`:

```ts
test('live round functions select question packs by canonical difficulty', () => {
  const questionsSource = readFileSync(
    new URL('../supabase/functions/_shared/questions.ts', import.meta.url),
    'utf8'
  );
  const startRoundSource = readFileSync(
    new URL('../supabase/functions/start-room-round/index.ts', import.meta.url),
    'utf8'
  );
  const getRoundSource = readFileSync(
    new URL('../supabase/functions/get-room-round/index.ts', import.meta.url),
    'utf8'
  );

  assert.match(questionsSource, /difficulty: ContentDifficulty/);
  assert.match(questionsSource, /\.eq\('difficulty', difficulty\)/);
  assert.match(startRoundSource, /difficulty: room\.difficulty/);
  assert.match(startRoundSource, /content_pack_version: room\.content_pack_version/);
  assert.match(getRoundSource, /content_pack_version, difficulty, question_count, topic_mode/);
});
```

- [ ] **Step 2: Run the targeted test and verify it fails**

Run:

```bash
npx tsx --test tests/supabase-room-contracts.test.ts
```

Expected: FAIL because the shared question selector does not filter by difficulty yet.

- [ ] **Step 3: Make question-pack selection difficulty-aware**

Modify `supabase/functions/_shared/questions.ts`:

```ts
import type { ContentDifficulty } from './room-settings.ts';
```

Change the signature:

```ts
export async function getLocalizedQuestionPack(
  locale: string,
  difficulty: ContentDifficulty = 'medium',
  count = 8
) {
```

Add the difficulty filter:

```ts
.eq('locale', locale)
.eq('difficulty', difficulty)
```

Return the selected difficulty:

```ts
return {
  difficulty,
  pack,
  questions: questions as QuestionRow[],
};
```

- [ ] **Step 4: Start room rounds from persisted room settings**

Modify `supabase/functions/start-room-round/index.ts`:

```ts
const { questions } = await getLocalizedQuestionPack(
  body.locale ?? 'en',
  room.difficulty,
  room.question_count
);
```

Insert settings into the round:

```ts
.insert({
  content_pack_version: room.content_pack_version,
  difficulty: room.difficulty,
  question_count: room.question_count,
  question_ids: questionIds,
  room_id: room.id,
  topic_mode: room.topic_mode,
})
```

Return settings from the round select:

```ts
.select('id, room_id, question_ids, started_at, ends_at, content_pack_version, difficulty, question_count, topic_mode')
```

- [ ] **Step 5: Return round settings from resume**

Modify `supabase/functions/get-room-round/index.ts` round select:

```ts
.select('id, room_id, question_ids, started_at, ends_at, content_pack_version, difficulty, question_count, topic_mode')
```

- [ ] **Step 6: Keep start-solo-round explicitly medium until a solo difficulty API is designed**

Modify `supabase/functions/start-solo-round/index.ts`:

```ts
const { pack, questions } = await getLocalizedQuestionPack(body.locale ?? 'en', 'medium');
```

This preserves existing solo live behavior and avoids adding a hidden public API in this review-fix pass.

- [ ] **Step 7: Verify round metadata contracts**

Run:

```bash
npx tsx --test tests/supabase-room-contracts.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit round settings metadata**

```bash
git add \
  supabase/functions/_shared/questions.ts \
  supabase/functions/start-room-round/index.ts \
  supabase/functions/get-room-round/index.ts \
  supabase/functions/start-solo-round/index.ts \
  src/lib/api-contracts.ts \
  tests/supabase-room-contracts.test.ts
git commit -m "fix: start live rounds with room difficulty"
```

---

## Task 4: Wire Online Difficulty Changes Through the Client

**Files:**
- Create: `supabase/functions/update-room-settings/index.ts`
- Modify: `src/features/rooms/live-room-service.ts`
- Modify: `src/features/rooms/use-room-lobby.ts`
- Modify: `app/rooms.tsx`
- Test: `tests/live-room-lifecycle.test.ts`

- [ ] **Step 1: Write failing source-level lifecycle tests**

Extend `tests/live-room-lifecycle.test.ts`:

```ts
test('online room creation and start send canonical match settings', () => {
  const liveRoomServiceSource = readFileSync(
    new URL('../src/features/rooms/live-room-service.ts', import.meta.url),
    'utf8'
  );

  assert.match(liveRoomServiceSource, /createLiveRoom\(profile: GuestProfile, settings: RoomMatchSettings\)/);
  assert.match(liveRoomServiceSource, /contentPackVersion: settings\.contentPackVersion/);
  assert.match(liveRoomServiceSource, /difficulty: settings\.difficulty/);
  assert.match(liveRoomServiceSource, /questionCount: settings\.questionCount/);
  assert.match(liveRoomServiceSource, /topicMode: settings\.topicMode/);
  assert.match(liveRoomServiceSource, /updateLiveRoomSettings/);
});

test('room lobby routes difficulty changes through live settings when online', () => {
  const roomLobbyHookSource = readFileSync(
    new URL('../src/features/rooms/use-room-lobby.ts', import.meta.url),
    'utf8'
  );
  const roomsRouteSource = readFileSync(new URL('../app/rooms.tsx', import.meta.url), 'utf8');

  assert.match(roomLobbyHookSource, /handleSelectDifficulty/);
  assert.match(roomLobbyHookSource, /updateLiveRoomSettings/);
  assert.match(roomsRouteSource, /onSelectDifficulty=\{lobby\.handleSelectDifficulty\}/);
});
```

- [ ] **Step 2: Run the lifecycle test and verify it fails**

Run:

```bash
npx tsx --test tests/live-room-lifecycle.test.ts
```

Expected: FAIL because live-room creation still sends only locale and room code, and `rooms.tsx` still calls `setSelectedDifficulty` directly.

- [ ] **Step 3: Add the host-only update settings Edge Function**

Create `supabase/functions/update-room-settings/index.ts`:

```ts
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { requireAuthenticatedUser } from '../_shared/auth.ts';
import { serviceClient } from '../_shared/client.ts';
import { handleCors, jsonResponse, requireJsonBody } from '../_shared/http.ts';
import { parseRoomMatchSettingsPayload, type RoomMatchSettingsPayload } from '../_shared/room-settings.ts';
import { getRoomByCode, listRoomParticipants } from '../_shared/rooms.ts';

type UpdateRoomSettingsPayload = RoomMatchSettingsPayload & {
  roomCode: string;
};

serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const user = await requireAuthenticatedUser(request);
    const body = await requireJsonBody<UpdateRoomSettingsPayload>(request);
    const room = await getRoomByCode(body.roomCode);

    if (!room) {
      throw new Error('Room not found.');
    }

    if (room.host_id !== user.id) {
      throw new Error('Only the room host can update match settings.');
    }

    if (room.current_round_id || room.status === 'active' || room.status === 'finalizing') {
      throw new Error('Room settings can only be changed before a round starts.');
    }

    const settings = parseRoomMatchSettingsPayload(body);
    const { data: updatedRoom, error: updateError } = await serviceClient
      .from('rooms')
      .update(settings)
      .eq('id', room.id)
      .select('id, room_code, host_id, status, current_round_id, content_pack_version, difficulty, question_count, topic_mode')
      .single();

    if (updateError || !updatedRoom) {
      throw updateError ?? new Error('Unable to update room settings.');
    }

    return jsonResponse({
      participants: await listRoomParticipants(room.id),
      room: updatedRoom,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Unknown update-room-settings failure.',
      },
      400
    );
  }
});
```

- [ ] **Step 4: Update live-room service payloads**

Modify imports in `src/features/rooms/live-room-service.ts`:

```ts
import type { RoomMatchSettings } from './room-match-settings';
```

Change `createLiveRoom` signature and payload:

```ts
export async function createLiveRoom(profile: GuestProfile, settings: RoomMatchSettings) {
  try {
    const payload = await invokeSupabaseFunction<
      CreateOrJoinRoomResponse,
      {
        contentPackVersion: string;
        difficulty: RoomMatchSettings['difficulty'];
        locale: GuestProfile['locale'];
        questionCount: 8;
        topicMode: 'mixed';
      }
    >('create-room', {
      contentPackVersion: settings.contentPackVersion,
      difficulty: settings.difficulty,
      locale: profile.locale,
      questionCount: settings.questionCount,
      topicMode: settings.topicMode,
    });

    return mapRoom(parseCreateOrJoinRoomResponse(payload));
  } catch (error) {
    throw new Error(toPlayerSafeErrorMessage(error));
  }
}
```

Add:

```ts
export async function updateLiveRoomSettings(activeRoom: ActiveRoom, settings: RoomMatchSettings) {
  try {
    const payload = await invokeSupabaseFunction<
      CreateOrJoinRoomResponse,
      {
        contentPackVersion: string;
        difficulty: RoomMatchSettings['difficulty'];
        questionCount: 8;
        roomCode: string;
        topicMode: 'mixed';
      }
    >('update-room-settings', {
      contentPackVersion: settings.contentPackVersion,
      difficulty: settings.difficulty,
      questionCount: settings.questionCount,
      roomCode: activeRoom.roomCode,
      topicMode: settings.topicMode,
    });

    return mapRoom(parseCreateOrJoinRoomResponse(payload));
  } catch (error) {
    throw new Error(toPlayerSafeErrorMessage(error));
  }
}
```

Change `startLiveRoomRound` payload:

```ts
{
  contentPackVersion: activeRoom.settings.contentPackVersion,
  difficulty: activeRoom.settings.difficulty,
  locale: profile.locale,
  questionCount: activeRoom.settings.questionCount,
  roomCode: activeRoom.roomCode,
  topicMode: activeRoom.settings.topicMode,
}
```

- [ ] **Step 5: Route difficulty selection through the room hook**

Modify `src/features/rooms/use-room-lobby.ts` imports:

```ts
import { createDefaultRoomMatchSettings } from './room-match-settings';
```

Add `setSelectedDifficulty` selector:

```ts
const setSelectedDifficulty = useAppStore((state) => state.setSelectedDifficulty);
```

Change create room:

```ts
const settings = createDefaultRoomMatchSettings(selectedDifficulty);
const room = await createLiveRoom(profile, settings);
```

Add:

```ts
const handleSelectDifficulty = async (difficulty: typeof selectedDifficulty) => {
  setSelectedDifficulty(difficulty);

  if (!activeRoom || !profile || !isSupabaseConfigured || activeRoom.status === 'active') {
    return;
  }

  const localPlayer = activeRoom.participants.find((participant) => participant.isLocalPlayer);
  if (!localPlayer?.isHost) {
    return;
  }

  setErrorMessage(null);
  setIsBusy(true);

  try {
    await ensureGuestSession(profile);
    const room = await updateLiveRoomSettings(
      activeRoom,
      createDefaultRoomMatchSettings(difficulty)
    );
    setActiveRoom(room);
  } catch (error) {
    setErrorMessage(error instanceof Error ? error.message : messages.genericError);
  } finally {
    setIsBusy(false);
  }
};
```

Return `handleSelectDifficulty` from the hook.

- [ ] **Step 6: Use the hook handler from the route**

Modify `app/rooms.tsx`:

```ts
const selectedDifficulty = useAppStore((state) => state.selectedDifficulty);
```

Remove:

```ts
const setSelectedDifficulty = useAppStore((state) => state.setSelectedDifficulty);
```

Change prop:

```tsx
onSelectDifficulty={lobby.handleSelectDifficulty}
```

- [ ] **Step 7: Verify client settings wiring**

Run:

```bash
npx tsx --test tests/live-room-lifecycle.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit client settings wiring**

```bash
git add \
  supabase/functions/update-room-settings/index.ts \
  src/features/rooms/live-room-service.ts \
  src/features/rooms/use-room-lobby.ts \
  app/rooms.tsx \
  tests/live-room-lifecycle.test.ts
git commit -m "fix: sync live room difficulty settings"
```

---

## Task 5: Reduce Dependency Audit Risk Without Breaking Expo 55

**Files:**
- Modify: `package-lock.json`
- Modify: `package.json` only if npm requires `overrides` for a nonbreaking transitive patch

- [ ] **Step 1: Capture the current audit baseline**

Run:

```bash
npm audit --omit=dev
```

Expected before fix: FAIL with 16 vulnerabilities including `@xmldom/xmldom`, `picomatch`, `postcss`, `uuid`, `yaml`, and `brace-expansion`.

- [ ] **Step 2: Apply the non-force audit remediation**

Run:

```bash
npm audit fix
```

Expected: npm updates only package lock transitive dependencies that do not require downgrading Expo. If npm proposes `--force` or Expo 49, do not run `npm audit fix --force`.

- [ ] **Step 3: Inspect dependency resolution**

Run:

```bash
npm ls @xmldom/xmldom picomatch postcss uuid yaml brace-expansion
```

Expected: no invalid dependency tree. Expo remains `55.x`; React Native remains `0.83.x`.

- [ ] **Step 4: Add npm overrides only for remaining direct transitive patches that keep validation green**

If high vulnerabilities remain for `@xmldom/xmldom` or `picomatch`, add this block to `package.json` after `devDependencies`:

```json
  "overrides": {
    "@xmldom/xmldom": "^0.8.12",
    "brace-expansion": "^1.1.14",
    "picomatch": "^4.0.4",
    "yaml": "^2.8.3"
  }
```

Then run:

```bash
npm install
```

Expected: lockfile resolves patched transitive versions or npm reports a conflict. If npm reports a conflict, remove only the conflicting override and keep the others that resolve cleanly.

- [ ] **Step 5: Verify the audit and Expo export**

Run:

```bash
npm audit --omit=dev
npm run validate
```

Expected: `npm run validate` passes. Audit should have no high vulnerabilities. If moderate vulnerabilities remain only through Expo upstream packages that require a breaking Expo downgrade, document them in the final verification notes with the exact package chain from `npm audit --omit=dev`.

- [ ] **Step 6: Commit dependency remediation**

```bash
git add package.json package-lock.json
git commit -m "chore: reduce production dependency audit risk"
```

---

## Task 6: Full Regression Verification and Browser Smoke

**Files:**
- No planned source edits.

- [ ] **Step 1: Run all targeted review-fix tests**

Run:

```bash
npx tsx --test \
  tests/live-room-security.test.ts \
  tests/supabase-room-contracts.test.ts \
  tests/live-room-lifecycle.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run content and localization guards**

Run:

```bash
npx tsx scripts/build-translation-worklist.ts
npx tsx scripts/lint-question-duplicates.ts
npx tsx scripts/validate-master-question-program.ts
npx tsx scripts/validate-question-bank.ts
```

Expected:

```text
[]
Built translation worklist with 0 record(s).
Duplicate lint passed for 360 master question record(s).
Validated master question program with 26 source entries, 72 slot records, and 360 master question record(s).
Validated 360 Minecraft question record(s) from content/minecraft/minecraft-question-bank.v1.json
```

- [ ] **Step 3: Run the full validation gate**

Run:

```bash
npm run validate
```

Expected: test suite passes, `tsc --noEmit` passes, and `npx expo export --platform web` succeeds.

- [ ] **Step 4: Run the production dependency audit**

Run:

```bash
npm audit --omit=dev
```

Expected: no high vulnerabilities. If remaining moderate issues are Expo-upstream only, record the exact package chains and do not use `npm audit fix --force`.

- [ ] **Step 5: Browser smoke the exported web app**

Serve the export:

```bash
python3 -m http.server 8080 --directory dist
```

Open:

```text
http://127.0.0.1:8080
```

Check:
- onboarding renders in Ukrainian
- language buttons do not overlap
- room lobby difficulty selector renders
- no console errors beyond the existing i18next informational Locize message

- [ ] **Step 6: Stop the local server**

Stop the `python3 -m http.server` process with `Ctrl+C`.

- [ ] **Step 7: Final git status check**

Run:

```bash
git status --short --branch
```

Expected: clean working tree after commits, or only intentional uncommitted changes if the user requested no commits.

---

## Self-Review

- Spec coverage: Finding 1 is covered by Task 1. Finding 2 is covered by Tasks 2, 3, and 4. Finding 3 is covered by Task 5. Full regression is covered by Task 6.
- Placeholder scan: no deferred implementation language is used; each code-changing step includes concrete code or exact command output expectations.
- Type consistency: client settings use `RoomMatchSettings` with camelCase fields; Edge Function DB rows use snake_case fields; response schemas keep the existing snake_case wire format.
- YAGNI check: no leaderboard, solo live difficulty, or broad room settings UI redesign is included. The plan only makes the existing room difficulty control authoritative for online rooms.
