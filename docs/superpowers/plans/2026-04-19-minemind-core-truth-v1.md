# MineMind Core Truth And Honest V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace prototype-only result truth with a real match-history model, truthful provenance, and an honest home screen that no longer uses fake leaderboard data.

**Architecture:** Introduce a canonical `MatchRecord` model, migrate persisted state from `lastResult` to `recentMatches`, and update the home/results surfaces to render only honest product state. Keep the current solo and room flows working by normalizing their outputs rather than rewriting game logic.

**Tech Stack:** Expo Router, React Native, TypeScript, Zustand persist, AsyncStorage, existing results/home feature components, Node test runner

---

## File Structure

### Existing files to modify

- `app/home.tsx`
- `app/results.tsx`
- `src/state/app-store.ts`
- `src/features/home/home-view.tsx`
- `src/features/results/results-view.tsx`
- `src/features/results/recover-room-result.ts`
- `tests/app-shell.test.ts`
- `tests/result-summary.test.ts`

### New files to create

- `src/features/results/match-record.ts`
- `src/features/results/normalize-match-record.ts`
- `tests/match-record.test.ts`
- `tests/home-honesty.test.ts`

## Task 1: Introduce The Canonical MatchRecord Model

**Files:**
- Create: `src/features/results/match-record.ts`
- Create: `src/features/results/normalize-match-record.ts`
- Create: `tests/match-record.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('normalizeQuizResultSummary creates a truthful local solo MatchRecord', () => {
  const record = normalizeMatchRecord({
    input: sampleSoloSummary,
    authority: 'client',
    isDemo: false,
    transport: 'local',
  });

  assert.equal(record.mode, 'solo');
  assert.equal(record.transport, 'local');
  assert.equal(record.authority, 'client');
  assert.equal(record.syncStatus, 'local-only');
  assert.equal(record.isDemo, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/match-record.test.ts`

Expected: FAIL because `MatchRecord` and `normalizeMatchRecord` do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export type MatchRecord = {
  id: string;
  mode: 'solo' | 'room' | 'classroom';
  transport: 'local' | 'supabase' | 'lan-host' | 'bluetooth-peer';
  authority: 'client' | 'server' | 'host-device';
  syncStatus: 'local-only' | 'pending-upload' | 'synced' | 'recovered';
  isDemo: boolean;
  completedAt: string;
  score: number;
  correctAnswers: number;
  questionCount: number;
  bestStreak: number;
  difficulty?: string;
  roomCode?: string;
  participants: Array<{ id?: string; isPlayer: boolean; name: string; score: number }>;
  breakdown: QuizResultSummary['breakdown'];
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/match-record.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/results/match-record.ts src/features/results/normalize-match-record.ts tests/match-record.test.ts
git commit -m "feat: add truthful match record model"
```

## Task 2: Migrate The Store From lastResult To recentMatches

**Files:**
- Modify: `src/state/app-store.ts`
- Modify: `src/features/results/recover-room-result.ts`
- Modify: `tests/result-summary.test.ts`

- [ ] **Step 1: Write the failing migration test**

```ts
test('store migration preserves legacy lastResult as the first recent match', () => {
  const migrated = migratePersistedState({ lastResult: sampleRoomSummary });

  assert.equal(migrated.recentMatches.length, 1);
  assert.equal(migrated.lastMatchId, migrated.recentMatches[0].id);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/result-summary.test.ts`

Expected: FAIL because the store still persists only `lastResult`.

- [ ] **Step 3: Write minimal implementation**

```ts
type AppState = {
  recentMatches: MatchRecord[];
  lastMatchId?: string;
  saveMatchRecord: (record: MatchRecord) => void;
};
```

```ts
saveMatchRecord: (record) =>
  set((state) => ({
    recentMatches: [record, ...state.recentMatches].slice(0, 20),
    lastMatchId: record.id,
  })),
```

- [ ] **Step 4: Run focused verification**

Run: `npx tsx --test tests/result-summary.test.ts tests/match-record.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/state/app-store.ts src/features/results/recover-room-result.ts tests/result-summary.test.ts
git commit -m "feat: persist truthful recent match history"
```

## Task 3: Make Home And Results Truthful

**Files:**
- Modify: `app/home.tsx`
- Modify: `app/results.tsx`
- Modify: `src/features/home/home-view.tsx`
- Modify: `src/features/results/results-view.tsx`
- Create: `tests/home-honesty.test.ts`
- Modify: `tests/app-shell.test.ts`

- [ ] **Step 1: Write the failing UI honesty tests**

```ts
test('home route no longer imports leaderboardPreview mock data', () => {
  const source = readFileSync(new URL('../app/home.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /leaderboardPreview/);
});
```

```ts
test('results route reads the latest MatchRecord instead of raw lastResult', () => {
  const source = readFileSync(new URL('../app/results.tsx', import.meta.url), 'utf8');
  assert.match(source, /recentMatches/);
  assert.doesNotMatch(source, /lastResult/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx tsx --test tests/home-honesty.test.ts tests/app-shell.test.ts`

Expected: FAIL because the mocked leaderboard and `lastResult` path still exist.

- [ ] **Step 3: Write minimal implementation**

```tsx
<HomeView
  recentMatches={recentMatches}
  showLeaderboard={false}
/>
```

```tsx
<ResultsView
  matchRecord={latestMatch}
  sourceLabel={getMatchSourceLabel(latestMatch)}
/>
```

- [ ] **Step 4: Run focused verification**

Run: `npx tsx --test tests/home-honesty.test.ts tests/app-shell.test.ts tests/match-record.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/home.tsx app/results.tsx src/features/home/home-view.tsx src/features/results/results-view.tsx tests/home-honesty.test.ts tests/app-shell.test.ts
git commit -m "feat: make home and results honest about match provenance"
```

## Task 4: Run Full Verification

**Files:**
- Modify: none
- Test: `tests/match-record.test.ts`
- Test: `tests/home-honesty.test.ts`
- Test: `tests/result-summary.test.ts`
- Test: `tests/app-shell.test.ts`

- [ ] **Step 1: Run focused suite**

Run: `npx tsx --test tests/match-record.test.ts tests/home-honesty.test.ts tests/result-summary.test.ts tests/app-shell.test.ts`

Expected: PASS with `0` failures.

- [ ] **Step 2: Run full validation**

Run: `npm run validate`

Expected: PASS, including `npm test`, `npm run typecheck`, and `npx expo export --platform web`.

- [ ] **Step 3: Commit verification-only if needed**

```bash
git status --short
```

Expected: only the intentional truthful-history changes remain.
