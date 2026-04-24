# MineMind Core Truth And Honest V1 Design

## Scope

This subproject defines the truth layer for MineMind before deeper multiplayer investment.

The goal is to stop the app from presenting demo or simulated data as if it were real player progress.

This design covers:

- real vs demo provenance for match results
- persistent match history instead of a single `lastResult`
- removing fake social proof such as the mocked leaderboard preview
- preparing the domain model used later by online and classroom multiplayer

This design does not add realtime, internet multiplayer transport, or Bluetooth transport.

## Current State

The codebase already has useful pieces:

- solo and room flows produce a `QuizResultSummary`
- `lastResult` is persisted in the app store
- home can surface a recent result summary
- online room flow already exists conceptually through Supabase-backed services

The current truth problem is not that results are broken. The problem is that product surfaces do not clearly distinguish:

- `real result` vs `demo/simulated result`
- `local-only result` vs `server-backed result`
- `single recent result` vs `real player history`

The home screen also still uses a mocked leaderboard preview from quiz mock data. That is acceptable for prototype scaffolding, but not for an honest V1.

## Problems To Solve

1. `Fake leaderboard`
   The current weekly leaderboard is hardcoded and therefore misleading.

2. `No durable match history`
   The app only persists the latest result, which is too shallow for a real product memory model.

3. `No provenance model`
   Results do not encode whether they came from solo local play, Supabase-backed room play, or future classroom/local-host play.

4. `No sync status`
   The app cannot honestly tell whether a result is local-only, pending upload, recovered from server state, or fully synced.

## Design Goals

After this subproject:

- every visible result has a truthful source label
- the app stores recent match history, not just one result
- the home screen shows only honest product state
- future transports can all map into one shared persisted record

## Recommended Domain Model

Introduce one canonical persisted record:

```ts
type MatchMode = 'solo' | 'room' | 'classroom';
type MatchTransport = 'local' | 'supabase' | 'lan-host' | 'bluetooth-peer';
type MatchAuthority = 'client' | 'server' | 'host-device';
type MatchSyncStatus = 'local-only' | 'pending-upload' | 'synced' | 'recovered';

type MatchRecord = {
  id: string;
  mode: MatchMode;
  transport: MatchTransport;
  authority: MatchAuthority;
  syncStatus: MatchSyncStatus;
  isDemo: boolean;
  completedAt: string;
  roomCode?: string;
  score: number;
  correctAnswers: number;
  questionCount: number;
  bestStreak: number;
  difficulty?: string;
  participants: Array<{
    id?: string;
    name: string;
    score: number;
    isPlayer: boolean;
  }>;
  breakdown: QuizResultSummary['breakdown'];
};
```

`QuizResultSummary` remains a UI-facing summary model during migration, but `MatchRecord` becomes the persisted product truth model.

## Product Behavior

### Home

The home screen should stop showing a fake leaderboard.

Replace it with one of these honest states:

- `Recent matches`
- `Your progress`
- `No real matches yet`

If the app only has demo/simulated records, it should say so explicitly instead of styling them as real competitive ranking.

### Results

Results should read from `MatchRecord` and be able to show provenance tags such as:

- `Solo on this device`
- `Online room result`
- `Classroom host result`
- `Demo room simulation`

The screen should not need to know transport internals, only the normalized provenance fields.

### Persistence

The store should evolve from:

- `lastResult?: QuizResultSummary`

to:

- `recentMatches: MatchRecord[]`
- `lastMatchId?: string`

Migration should preserve the current persisted latest result by normalizing it into the first `MatchRecord`.

## Architecture Decisions

1. `One record shape across all match types`
   Solo, online room, classroom host, and future Bluetooth all map into `MatchRecord`.

2. `Truth beats decoration`
   If a surface cannot be powered by real data, it should degrade to a truthful empty state rather than use fake prestige UI.

3. `Transport metadata is part of the product model`
   Provenance is not debugging metadata. It is part of what the player should understand.

## Out Of Scope

- realtime room sync
- Supabase room hardening
- LAN host transport
- Bluetooth or nearby transports
- teacher dashboards
- global accounts and profile syncing

## Acceptance Criteria

- the mocked home leaderboard is removed from the shipped product flow
- recent matches persist across app restarts
- every stored match has explicit `mode`, `transport`, `authority`, `syncStatus`, and `isDemo`
- result recovery from online rooms maps into the same record model
- the home screen never presents demo data as a real weekly ranking

## Risks And Mitigations

`Risk: migration complexity`
- Mitigation: add a one-time normalization path from legacy `lastResult`

`Risk: UI churn on home/results`
- Mitigation: keep views reading normalized selectors rather than raw store shape

`Risk: future transport divergence`
- Mitigation: make `MatchRecord` the only persisted product truth contract for completed matches
