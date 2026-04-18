# MineMind V1 Redesign And Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current MineMind prototype into a polished V1 by redesigning the core UX, cleaning route boundaries, hardening state and network handling, and expanding QA around real player flows.

**Architecture:** Keep the current Expo Router app and domain model, but move route orchestration into focused feature hooks/components, rewrite player-facing copy, and introduce a stronger design system plus validated network boundaries. Deliver in phases so solo remains working while rooms and hardening improve incrementally.

**Tech Stack:** Expo Router, React Native, TypeScript, Zustand, TanStack Query, i18next, Supabase Functions, Zod, Node test runner

---

## File Structure

### Existing files to modify

- `app/_layout.tsx`
- `app/onboarding.tsx`
- `app/home.tsx`
- `app/solo.tsx`
- `app/results.tsx`
- `app/rooms.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/screen.tsx`
- `src/components/ui/stat-pill.tsx`
- `src/components/ui/loading-screen.tsx`
- `src/theme/tokens.ts`
- `src/state/app-store.ts`
- `src/lib/supabase.ts`
- `src/i18n/resources.ts`

### New files to create

- `src/features/onboarding/onboarding-view.tsx`
- `src/features/home/home-view.tsx`
- `src/features/quiz/use-solo-round.ts`
- `src/features/quiz/quiz-feedback.ts`
- `src/features/results/results-view.tsx`
- `src/features/rooms/use-room-lobby.ts`
- `src/features/rooms/room-lobby-view.tsx`
- `src/features/shared/app-copy.ts`
- `src/lib/api-contracts.ts`
- `tests/app-shell.test.ts`
- `tests/solo-round.test.ts`
- `tests/room-lobby.test.ts`
- `tests/supabase-contracts.test.ts`

### Testing commands used throughout

- `npm test`
- `npm run typecheck`
- `npx expo export --platform web`
- `./script/build_and_run.sh --help`

## Task 1: Redesign The App Shell And Design Tokens

**Files:**
- Modify: `app/_layout.tsx`
- Modify: `src/components/ui/screen.tsx`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/stat-pill.tsx`
- Modify: `src/components/ui/loading-screen.tsx`
- Modify: `src/theme/tokens.ts`
- Test: `tests/app-shell.test.ts`

- [ ] **Step 1: Write the failing shell test**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

import { appTheme } from '../src/theme/tokens';

test('app theme exposes bottom-safe shell tokens and interaction states', () => {
  assert.ok(appTheme.surface.base);
  assert.ok(appTheme.surface.raised);
  assert.ok(appTheme.feedback.correct);
  assert.ok(appTheme.feedback.wrong);
  assert.ok(appTheme.layout.screenPadding);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/app-shell.test.ts`

Expected: FAIL because `appTheme` and the new grouped token structure do not exist yet.

- [ ] **Step 3: Implement the shell token and primitive refresh**

```ts
export const appTheme = {
  surface: {
    base: '#101826',
    raised: 'rgba(255,255,255,0.08)',
  },
  feedback: {
    correct: '#6EF0A6',
    wrong: '#FF7A72',
    waiting: '#FFD84D',
  },
  layout: {
    screenPadding: 20,
    screenGap: 16,
  },
};
```

```tsx
<SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={styles.safeArea}>
  <ScrollView
    contentInsetAdjustmentBehavior="automatic"
    contentContainerStyle={styles.scrollContent}
    showsVerticalScrollIndicator={false}
  >
    {content}
  </ScrollView>
</SafeAreaView>
```

```tsx
<Stack
  screenOptions={{
    headerShown: true,
    headerTransparent: true,
    headerTintColor: appTheme.text.primary,
    contentStyle: { backgroundColor: appTheme.surface.canvas },
  }}
/>
```

- [ ] **Step 4: Run focused verification**

Run: `npm test -- tests/app-shell.test.ts && npm run typecheck`

Expected: PASS, with no new TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add app/_layout.tsx src/components/ui/screen.tsx src/components/ui/button.tsx src/components/ui/card.tsx src/components/ui/stat-pill.tsx src/components/ui/loading-screen.tsx src/theme/tokens.ts tests/app-shell.test.ts
git commit -m "feat: refresh app shell and design tokens"
```

## Task 2: Rebuild Onboarding As A Real Product Entry

**Files:**
- Modify: `app/onboarding.tsx`
- Create: `src/features/onboarding/onboarding-view.tsx`
- Modify: `src/i18n/resources.ts`
- Test: `tests/nickname.test.ts`

- [ ] **Step 1: Add a failing onboarding-focused test case**

```ts
test('rejects nickname with punctuation and keeps trimmed value for recovery', () => {
  const result = validateNickname('  Craft!!!  ');

  assert.equal(result.valid, false);
  assert.equal(result.reasonKey, 'errors.nicknameInvalidChars');
  assert.equal(result.sanitizedValue, 'Craft!!!');
});
```

- [ ] **Step 2: Run the test to verify the current suite fails on the new case**

Run: `npm test -- tests/nickname.test.ts`

Expected: FAIL until the test is added and the validation expectations are wired correctly.

- [ ] **Step 3: Extract the onboarding presentation layer and rewrite copy**

```tsx
export function OnboardingView(props: {
  nickname: string;
  selectedAvatarId: string;
  selectedLocale: AppLocale;
  errorMessage?: string;
  onChangeNickname: (value: string) => void;
  onSelectAvatar: (avatarId: string) => void;
  onSelectLocale: (locale: AppLocale) => void;
  onSubmit: () => void;
}) {
  return (
    <Screen scrollable>
      <HeroCard title="Pick your player and jump in" />
      <ProfilePreviewCard />
      <NicknameField />
      <LanguagePicker />
      <AvatarPicker />
      <PrimaryButton label="Enter the quiz" onPress={props.onSubmit} />
    </Screen>
  );
}
```

```ts
onboarding: {
  eyebrow: 'Guest setup',
  title: 'Build your player',
  subtitle: 'Choose a safe nickname, an avatar, and your language. Then jump straight into the quiz.',
  privacyNote: 'No chat. No ads. No account form.',
}
```

- [ ] **Step 4: Run focused verification**

Run: `npm test -- tests/nickname.test.ts && npm run typecheck`

Expected: PASS, onboarding route compiles, nickname behavior stays green.

- [ ] **Step 5: Commit**

```bash
git add app/onboarding.tsx src/features/onboarding/onboarding-view.tsx src/i18n/resources.ts tests/nickname.test.ts
git commit -m "feat: redesign onboarding flow and product copy"
```

## Task 3: Redesign Home As A Strong Mode Selector

**Files:**
- Modify: `app/home.tsx`
- Create: `src/features/home/home-view.tsx`
- Modify: `src/i18n/resources.ts`
- Modify: `src/features/quiz/mock-data.ts`
- Test: `tests/app-shell.test.ts`

- [ ] **Step 1: Add a failing consistency test for round metadata**

```ts
import { minecraftCategory } from '../src/features/quiz/mock-data';

test('home metadata stays aligned with the documented round size', () => {
  assert.equal(minecraftCategory.roundQuestionCount, 8);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/app-shell.test.ts`

Expected: FAIL because `roundQuestionCount` is not exposed yet.

- [ ] **Step 3: Refactor home into a hero-first screen**

```ts
export const minecraftCategory = {
  id: 'minecraft',
  title: 'Minecraft Battle Quiz',
  roundQuestionCount: 8,
  roundDurationLabel: '2-4 min',
};
```

```tsx
export function HomeView(props: {
  nickname: string;
  localeLabel: string;
  modeLabel: string;
  hasActiveRoom: boolean;
  lastResult?: QuizResultSummary;
}) {
  return (
    <Screen scrollable>
      <ModeHeroCard />
      <PrimaryModeCard />
      <SecondaryRoomCard />
      <RewardRecapCard />
    </Screen>
  );
}
```

```ts
home: {
  subtitle: 'Choose your next match and keep your streak climbing.',
  playSolo: 'Start solo match',
  privateRooms: 'Play with friends',
}
```

- [ ] **Step 4: Run focused verification**

Run: `npm test -- tests/app-shell.test.ts && npm run typecheck`

Expected: PASS, round metadata stays aligned with game design.

- [ ] **Step 5: Commit**

```bash
git add app/home.tsx src/features/home/home-view.tsx src/i18n/resources.ts src/features/quiz/mock-data.ts tests/app-shell.test.ts
git commit -m "feat: redesign home screen and align round metadata"
```

## Task 4: Split Solo Round Logic From Presentation And Deepen Match Feedback

**Files:**
- Modify: `app/solo.tsx`
- Create: `src/features/quiz/use-solo-round.ts`
- Create: `src/features/quiz/quiz-feedback.ts`
- Modify: `src/i18n/resources.ts`
- Test: `tests/quiz-service.test.ts`
- Test: `tests/solo-round.test.ts`

- [ ] **Step 1: Write a failing round-state test**

```ts
import { createQuizFeedbackState } from '../src/features/quiz/quiz-feedback';

test('quiz feedback shows a revealed wrong answer state', () => {
  const state = createQuizFeedbackState({
    correctIndex: 2,
    isRevealed: true,
    selectedIndex: 1,
  });

  assert.equal(state.correctIndex, 2);
  assert.equal(state.selectedState, 'wrong');
});
```

- [ ] **Step 2: Run the new solo test to verify it fails**

Run: `npm test -- tests/solo-round.test.ts`

Expected: FAIL because the helper file does not exist yet.

- [ ] **Step 3: Extract orchestration and add richer feedback state**

```ts
export function createQuizFeedbackState(input: {
  correctIndex?: number;
  isRevealed: boolean;
  selectedIndex: number | null;
}) {
  if (!input.isRevealed) {
    return { correctIndex: input.correctIndex, selectedState: 'idle' as const };
  }

  if (input.selectedIndex === input.correctIndex) {
    return { correctIndex: input.correctIndex, selectedState: 'correct' as const };
  }

  return { correctIndex: input.correctIndex, selectedState: 'wrong' as const };
}
```

```ts
export function useSoloRound(params: {
  mode?: string;
  locale: AppLocale;
}) {
  // owns question loading, timer, answer reveal, finish, and retry state
}
```

```tsx
<QuestionHeader progressLabel={progressLabel} timerLabel={timerLabel} />
<QuestionCard prompt={question.prompt} />
<AnswerOptionList feedbackState={feedbackState} />
<FactRevealCard state={isRevealed ? 'open' : 'locked'} />
```

- [ ] **Step 4: Run focused verification**

Run: `npm test -- tests/quiz-service.test.ts tests/solo-round.test.ts && npm run typecheck`

Expected: PASS, with solo route behavior preserved and new feedback logic tested.

- [ ] **Step 5: Commit**

```bash
git add app/solo.tsx src/features/quiz/use-solo-round.ts src/features/quiz/quiz-feedback.ts src/i18n/resources.ts tests/quiz-service.test.ts tests/solo-round.test.ts
git commit -m "feat: refactor solo round orchestration and feedback"
```

## Task 5: Redesign Results Around Reward And Learning

**Files:**
- Modify: `app/results.tsx`
- Create: `src/features/results/results-view.tsx`
- Modify: `src/i18n/resources.ts`
- Modify: `src/features/quiz/quiz-service.ts`
- Test: `tests/quiz-service.test.ts`

- [ ] **Step 1: Add a failing result-label test**

```ts
test('buildQuizResult keeps player standings and speed bonus in the result model', () => {
  const result = buildQuizResult(sampleQuestions, {
    q1: { selectedIndex: 1, timeLeft: 10 },
    q2: { selectedIndex: 0, timeLeft: 5 },
  });

  assert.equal(result.standings[0].isPlayer, true);
  assert.equal(result.speedBonus, 90);
});
```

- [ ] **Step 2: Run the quiz test file to verify the new expectation fails before implementation**

Run: `npm test -- tests/quiz-service.test.ts`

Expected: FAIL after adding the new assertion if the model or test data does not yet expose the final structure cleanly.

- [ ] **Step 3: Create a richer results presentation**

```tsx
export function ResultsView(props: { result: QuizResultSummary }) {
  return (
    <Screen scrollable>
      <VictoryHero score={props.result.score} bestStreak={props.result.bestStreak} />
      <PodiumCard standings={props.result.standings} />
      <UnlockedFactsList breakdown={props.result.breakdown.slice(0, 3)} />
      <ActionRow />
    </Screen>
  );
}
```

```ts
results: {
  title: 'Your battle results',
  insights: 'Facts you unlocked',
  playAgain: 'Play another round',
}
```

- [ ] **Step 4: Run focused verification**

Run: `npm test -- tests/quiz-service.test.ts && npm run typecheck`

Expected: PASS, result calculations preserved and screen contract updated safely.

- [ ] **Step 5: Commit**

```bash
git add app/results.tsx src/features/results/results-view.tsx src/i18n/resources.ts src/features/quiz/quiz-service.ts tests/quiz-service.test.ts
git commit -m "feat: redesign results around reward and learning"
```

## Task 6: Productize The Rooms Flow

**Files:**
- Modify: `app/rooms.tsx`
- Create: `src/features/rooms/use-room-lobby.ts`
- Create: `src/features/rooms/room-lobby-view.tsx`
- Modify: `src/state/app-store.ts`
- Modify: `src/i18n/resources.ts`
- Test: `tests/room-flow.test.ts`
- Test: `tests/room-lobby.test.ts`

- [ ] **Step 1: Write a failing room-lobby state test**

```ts
import { deriveRoomLobbyState } from '../src/features/rooms/use-room-lobby';

test('room lobby state exposes a dominant room code and ready summary', () => {
  const state = deriveRoomLobbyState({
    roomCode: 'AB12CD',
    participants: [
      { id: '1', name: 'BlockFox', ready: true, isHost: true, isLocalPlayer: true, avatarId: 'fox' },
      { id: '2', name: 'PixelBee', ready: false, isHost: false, isLocalPlayer: false, avatarId: 'bee' },
    ],
    status: 'lobby',
  });

  assert.equal(state.readyCount, 1);
  assert.equal(state.canStart, false);
});
```

- [ ] **Step 2: Run the room-lobby test to verify it fails**

Run: `npm test -- tests/room-lobby.test.ts`

Expected: FAIL because the derived lobby helper does not exist yet.

- [ ] **Step 3: Extract room orchestration and rewrite staging copy**

```ts
export function deriveRoomLobbyState(room: ActiveRoom) {
  const readyCount = room.participants.filter((participant) => participant.ready).length;

  return {
    canStart: readyCount === room.participants.length && room.participants.length > 1,
    participantCount: room.participants.length,
    readyCount,
    roomCode: room.roomCode,
  };
}
```

```tsx
export function RoomLobbyView(props: {
  room?: ActiveRoom;
  isBusy: boolean;
  errorMessage?: string | null;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onToggleReady: () => void;
  onStart: () => void;
}) {
  return props.room ? <ActiveLobbyCard /> : <JoinOrCreateCard />;
}
```

```ts
rooms: {
  title: 'Play with friends',
  subtitle: 'Create a private room, share the code, and start when everyone is ready.',
  phaseTitle: 'Friends room',
  offlineCopy: 'You can already practice the room flow here, even before live sync is connected.',
}
```

- [ ] **Step 4: Run focused verification**

Run: `npm test -- tests/room-flow.test.ts tests/room-lobby.test.ts && npm run typecheck`

Expected: PASS, room flow remains stable while the screen and state boundaries improve.

- [ ] **Step 5: Commit**

```bash
git add app/rooms.tsx src/features/rooms/use-room-lobby.ts src/features/rooms/room-lobby-view.tsx src/state/app-store.ts src/i18n/resources.ts tests/room-flow.test.ts tests/room-lobby.test.ts
git commit -m "feat: productize rooms flow and lobby state"
```

## Task 7: Validate Supabase Contracts And Normalize Error UX

**Files:**
- Modify: `src/lib/supabase.ts`
- Create: `src/lib/api-contracts.ts`
- Modify: `src/features/quiz/live-quiz-service.ts`
- Modify: `src/features/rooms/live-room-service.ts`
- Modify: `src/features/profile/profile-service.ts`
- Modify: `src/features/shared/app-copy.ts`
- Test: `tests/supabase-contracts.test.ts`

- [ ] **Step 1: Write a failing API contract test**

```ts
import { parseStartSoloRoundResponse } from '../src/lib/api-contracts';

test('start solo round parser rejects malformed payloads', () => {
  assert.throws(() => parseStartSoloRoundResponse({ questions: 'nope' }), /Invalid/);
});
```

- [ ] **Step 2: Run the contract test to verify it fails**

Run: `npm test -- tests/supabase-contracts.test.ts`

Expected: FAIL because the parser does not exist yet.

- [ ] **Step 3: Add Zod-based parsers and user-safe error mapping**

```ts
import { z } from 'zod';

const QuizQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  options: z.array(z.string()).min(2),
  correctIndex: z.number().optional(),
  explanation: z.string().optional(),
});

export function parseStartSoloRoundResponse(input: unknown) {
  return z.object({
    pack: z.object({ id: z.string(), title: z.string() }),
    questions: z.array(QuizQuestionSchema),
  }).parse(input);
}
```

```ts
export function toPlayerSafeErrorMessage(error: unknown) {
  return 'Something went wrong. Please try again.';
}
```

- [ ] **Step 4: Run focused verification**

Run: `npm test -- tests/supabase-contracts.test.ts && npm run typecheck`

Expected: PASS, malformed payloads are rejected early and UI-facing services can map friendly errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase.ts src/lib/api-contracts.ts src/features/quiz/live-quiz-service.ts src/features/rooms/live-room-service.ts src/features/profile/profile-service.ts src/features/shared/app-copy.ts tests/supabase-contracts.test.ts
git commit -m "feat: validate supabase contracts and normalize errors"
```

## Task 8: Finish Localization QA And Full Verification

**Files:**
- Modify: `src/i18n/resources.ts`
- Modify: `README.md`
- Test: `tests/app-shell.test.ts`
- Test: `tests/solo-round.test.ts`
- Test: `tests/room-lobby.test.ts`
- Test: `tests/supabase-contracts.test.ts`

- [ ] **Step 1: Add a failing localization consistency test**

```ts
import { resources } from '../src/i18n/resources';

test('critical home and rooms copy exists in every supported locale', () => {
  for (const locale of ['uk', 'en', 'ru'] as const) {
    assert.ok(resources[locale].translation.home.playSolo);
    assert.ok(resources[locale].translation.rooms.title);
    assert.ok(resources[locale].translation.results.title);
  }
});
```

- [ ] **Step 2: Run the targeted shell test file to verify the new assertion fails if any locale is missing**

Run: `npm test -- tests/app-shell.test.ts`

Expected: FAIL until all rewritten keys are present in every locale.

- [ ] **Step 3: Finish copy alignment and update operator documentation**

```md
## Validation
- `npm test`
- `npm run typecheck`
- `npm run validate`
- run `./script/build_and_run.sh --web` for a manual web smoke pass
```

```ts
home: {
  playSolo: 'Start solo match',
  privateRooms: 'Play with friends',
}
```

- [ ] **Step 4: Run full verification**

Run: `npm test && npm run typecheck && npm run validate`

Expected: PASS with all test files green and web export succeeding.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/resources.ts README.md tests/app-shell.test.ts tests/solo-round.test.ts tests/room-lobby.test.ts tests/supabase-contracts.test.ts
git commit -m "chore: finish localization qa and redesign verification"
```

## Self-Review

### Spec coverage

- App shell redesign: covered by Task 1
- Onboarding redesign: covered by Task 2
- Home redesign: covered by Task 3
- Solo loop redesign: covered by Task 4
- Results redesign: covered by Task 5
- Rooms productization: covered by Task 6
- Contract validation and safer error UX: covered by Task 7
- Localization QA and full verification: covered by Task 8

No gaps remain relative to the design spec.

### Placeholder scan

- No `TBD` or `TODO` markers remain
- Every task lists exact files
- Every task includes concrete test commands
- Every code-changing step includes a representative code block

### Type consistency

- `QuizResultSummary`, `ActiveRoom`, `ActiveRoomRound`, and locale keys are used consistently across tasks
- The plan keeps the current route map and domain naming, reducing rename drift risk

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-18-minemind-v1-redesign-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
