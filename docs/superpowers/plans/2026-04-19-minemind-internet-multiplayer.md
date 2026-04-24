# MineMind Internet Multiplayer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Supabase room path into a real, server-authoritative private multiplayer mode with realtime room sync, reconnect recovery, and persisted online match results.

**Architecture:** Keep Supabase as the canonical backend. Use Postgres and Edge Functions for authoritative room state and round logic, Supabase Realtime for low-latency lobby/room updates, and client-side polling only as a fallback recovery path. Persist finalized online results into the shared `MatchRecord` model from subproject A.

**Tech Stack:** Supabase Auth, Postgres, Edge Functions, Supabase Realtime Broadcast/Presence, Expo Router, React Native, TypeScript, Zod, Zustand

---

## File Structure

### Existing files to modify

- `supabase/migrations/20260315213000_initial_schema.sql`
- `supabase/functions/_shared/rooms.ts`
- `supabase/functions/_shared/validation.ts`
- `supabase/functions/create-room/index.ts`
- `supabase/functions/join-room/index.ts`
- `supabase/functions/get-room-state/index.ts`
- `supabase/functions/get-room-round/index.ts`
- `supabase/functions/set-room-ready/index.ts`
- `supabase/functions/start-room-round/index.ts`
- `supabase/functions/submit-answer/index.ts`
- `supabase/functions/finalize-round/index.ts`
- `src/lib/api-contracts.ts`
- `src/features/rooms/live-room-service.ts`
- `src/features/rooms/use-room-lobby.ts`
- `src/features/quiz/use-solo-round.ts`
- `src/features/results/recover-room-result.ts`
- `src/state/app-store.ts`

### New files to create

- `supabase/migrations/20260419_room_realtime_and_results.sql`
- `src/features/rooms/realtime-room-channel.ts`
- `tests/live-room-realtime.test.ts`
- `tests/supabase-room-contracts.test.ts`

## Task 1: Lock The Authoritative Room And Result Contracts

**Files:**
- Create: `supabase/migrations/20260419_room_realtime_and_results.sql`
- Modify: `supabase/functions/_shared/rooms.ts`
- Modify: `supabase/functions/_shared/validation.ts`
- Modify: `src/lib/api-contracts.ts`
- Create: `tests/supabase-room-contracts.test.ts`

- [ ] **Step 1: Write the failing contract test**

```ts
test('start room round response carries canonical room status and round manifest fields', () => {
  const parsed = startRoomRoundResponseSchema.parse(samplePayload);
  assert.equal(parsed.room.status, 'active');
  assert.ok(parsed.round.id);
  assert.ok(parsed.questions.length > 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/supabase-room-contracts.test.ts`

Expected: FAIL because the stricter contract schema does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```sql
alter table public.room_rounds
  add column if not exists finalized_at timestamptz,
  add column if not exists result_snapshot jsonb;
```

```ts
export const roomStatusSchema = z.enum(['lobby', 'active', 'waiting', 'finalizing', 'finished']);
```

- [ ] **Step 4: Run focused verification**

Run: `npx tsx --test tests/supabase-room-contracts.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260419_room_realtime_and_results.sql supabase/functions/_shared/rooms.ts supabase/functions/_shared/validation.ts src/lib/api-contracts.ts tests/supabase-room-contracts.test.ts
git commit -m "feat: harden authoritative room contracts"
```

## Task 2: Add A Realtime Adapter Boundary For Rooms

**Files:**
- Create: `src/features/rooms/realtime-room-channel.ts`
- Modify: `src/features/rooms/live-room-service.ts`
- Create: `tests/live-room-realtime.test.ts`

- [ ] **Step 1: Write the failing realtime boundary test**

```ts
test('room realtime channel emits room-updated and round-started events through one adapter', () => {
  const events = collectRoomRealtimeEvents(fakeRoomChannel);
  assert.deepEqual(events, ['room-updated', 'round-started']);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/live-room-realtime.test.ts`

Expected: FAIL because no client-side realtime adapter exists yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export type RoomRealtimeEvent =
  | { type: 'room-updated'; roomCode: string }
  | { type: 'round-started'; roomCode: string; roundId: string }
  | { type: 'round-finalizing'; roomCode: string; roundId: string }
  | { type: 'room-finished'; roomCode: string; roundId: string };
```

```ts
export function subscribeToRoomChannel(roomCode: string, handlers: RoomRealtimeHandlers) {
  // Presence + Broadcast subscription
}
```

- [ ] **Step 4: Run focused verification**

Run: `npx tsx --test tests/live-room-realtime.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/rooms/realtime-room-channel.ts src/features/rooms/live-room-service.ts tests/live-room-realtime.test.ts
git commit -m "feat: add realtime room adapter"
```

## Task 3: Make Room Lobby Realtime-First With Polling Fallback

**Files:**
- Modify: `src/features/rooms/use-room-lobby.ts`
- Modify: `src/features/rooms/live-room-service.ts`
- Modify: `tests/room-lobby.test.ts`

- [ ] **Step 1: Write the failing lobby test**

```ts
test('room lobby uses realtime subscription as the primary sync path', () => {
  const source = readFileSync(new URL('../src/features/rooms/use-room-lobby.ts', import.meta.url), 'utf8');
  assert.match(source, /subscribeToRoomChannel/);
  assert.match(source, /refreshLiveRoom/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/room-lobby.test.ts`

Expected: FAIL because the hook still depends on polling as the primary sync path.

- [ ] **Step 3: Write minimal implementation**

```ts
const unsubscribe = subscribeToRoomChannel(activeRoom.roomCode, {
  onRoomUpdated: () => void syncRoomState(),
  onRoundStarted: () => void syncRoomState(),
  onRoomFinished: () => void syncRoomState(),
});
```

- [ ] **Step 4: Run focused verification**

Run: `npx tsx --test tests/room-lobby.test.ts tests/live-room-realtime.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/rooms/use-room-lobby.ts src/features/rooms/live-room-service.ts tests/room-lobby.test.ts
git commit -m "feat: make room lobby realtime-first"
```

## Task 4: Persist Finalized Online Results And Recovery

**Files:**
- Modify: `supabase/functions/finalize-round/index.ts`
- Modify: `src/features/quiz/use-solo-round.ts`
- Modify: `src/features/results/recover-room-result.ts`
- Modify: `src/state/app-store.ts`
- Modify: `tests/live-room-result-recovery.test.ts`
- Modify: `tests/live-room-lifecycle.test.ts`

- [ ] **Step 1: Write the failing recovery test**

```ts
test('finalized online room results are persisted as synced MatchRecords', () => {
  const record = buildRecoveredRoomResult(sampleRound, sampleRankings, 'player-1');
  assert.equal(record.syncStatus, 'synced');
  assert.equal(record.transport, 'supabase');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/live-room-result-recovery.test.ts tests/live-room-lifecycle.test.ts`

Expected: FAIL because recovered results are not yet normalized into the truthful persisted record model.

- [ ] **Step 3: Write minimal implementation**

```ts
const finalizedRecord = normalizeMatchRecord({
  input: finalized.result,
  authority: 'server',
  isDemo: false,
  syncStatus: 'synced',
  transport: 'supabase',
});
```

- [ ] **Step 4: Run focused verification**

Run: `npx tsx --test tests/live-room-result-recovery.test.ts tests/live-room-lifecycle.test.ts tests/supabase-room-contracts.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/finalize-round/index.ts src/features/quiz/use-solo-round.ts src/features/results/recover-room-result.ts src/state/app-store.ts tests/live-room-result-recovery.test.ts tests/live-room-lifecycle.test.ts
git commit -m "feat: persist recovered online room results"
```

## Task 5: Run Full Verification

**Files:**
- Modify: none
- Test: `tests/live-room-realtime.test.ts`
- Test: `tests/supabase-room-contracts.test.ts`
- Test: `tests/room-lobby.test.ts`
- Test: `tests/live-room-lifecycle.test.ts`
- Test: `tests/live-room-result-recovery.test.ts`

- [ ] **Step 1: Run focused suite**

Run: `npx tsx --test tests/live-room-realtime.test.ts tests/supabase-room-contracts.test.ts tests/room-lobby.test.ts tests/live-room-lifecycle.test.ts tests/live-room-result-recovery.test.ts`

Expected: PASS with `0` failures.

- [ ] **Step 2: Run full validation**

Run: `npm run validate`

Expected: PASS, with web export still succeeding.

- [ ] **Step 3: Spot-check Supabase artifacts**

Run:

```bash
git diff -- supabase/migrations supabase/functions src/features/rooms src/features/quiz src/features/results src/state tests
```

Expected: diff shows only the intentional realtime and authoritative-result changes.
