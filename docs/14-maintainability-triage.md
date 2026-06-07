# Maintainability Triage

## Latest Reviewed Scan

- Command: `npm run doctor:react`
- Baseline score: `82 / 100`
- Reviewed date: `2026-06-07`

## Classifications

| Finding | File | Classification | Evidence | Next Probe |
| --- | --- | --- | --- | --- |
| `await inside a loop` | `src/features/rooms/live-room-service.ts` | intentional polling loop | `finalizeLiveRoomRound` calls `finalize-round`, breaks on `completed`, then waits `FINALIZE_WAIT_INTERVAL_MS` before retrying. The awaits are sequential by design because each response determines whether another attempt is needed. | Keep as reviewed unless finalization UX changes. |
| `event logic handled in an effect` | `src/features/quiz/use-solo-round.ts` | needs source review before editing | The flagged lines are mode-derived constants, but the surrounding hook contains result and classroom effects. Behavior is covered by room/classroom tests, yet a direct refactor may be risky. | Add focused tests before changing result publication or recovery effects. |
| `await before an early-return guard` | `supabase/functions/get-room-round/index.ts` | security-sensitive ordering | The function checks room membership before reporting whether a room has an active round. Moving the active-round guard earlier may reveal room state to non-members. | Keep membership before round-state disclosure unless product security requirements change. |
| `unused Edge Function entrypoints` | `supabase/functions/*/index.ts` | analyzer blind spot | `scripts/check-edge-functions.mjs` discovers every non-shared function directory and Deno-checks each `index.ts`. These files are invoked by Supabase, not imported by app TypeScript. | Do not delete entrypoints based on static import analysis. |
| `unused dev dependency` | `package.json` | needs package-level verification | `deno` is available during npm scripts and CI also installs Deno with `denoland/setup-deno`. The package may be redundant, but removing it changes local `npm run check:edge` behavior on machines without global Deno. | Verify `npm run check:edge` after removing the dependency in a separate dependency cleanup branch. |

## Rule

Do not suppress React Doctor findings globally. Confirm each finding from source code, add a focused regression test when behavior can change, then make the smallest behavior-preserving edit.
