# MineMind Full Audit Remediation Plan

> For agentic workers: use the Superpowers flow as `facts -> findings -> implementation tasks -> exit criteria`. Do not copy older Expo commands from previous plans without rechecking current SDK expectations.

**Audit date:** 2026-06-06  
**Scope:** Expo/React Native app, web export, Supabase Edge Function contracts, content pipeline, CI/release readiness, accessibility/performance risks.  
**Current branch state:** `main...origin/main [ahead 20]`, clean working tree during audit.

## Remediation Progress On 2026-06-06

Completed in branch `codex/minemind-full-remediation`:

- Release validation gate added as `npm run validate:release`.
- CI now installs Deno and runs the release validation suite.
- Expo SDK 55 patch packages aligned; Expo Doctor now passes.
- `npm audit --audit-level=moderate` now reports `0` vulnerabilities.
- Supabase Edge Function entrypoints are checked with Deno via `npm run check:edge`.
- Web export route fallback server and smoke check added; direct loads for `/`, `/home`, `/solo`, `/rooms`, and `/classroom` now pass through the exported app shell.
- Netlify selected as the production static web host target via `netlify.toml`; all routes rewrite to `/index.html`.
- Web export budget gate added as `npm run check:web-budget`.
- Android QA script now regenerates the ignored native Android project with Expo prebuild when needed.
- Android AVD QA completed on `minemind_qa_api35`: `npm run android:qa` installed the debug APK on `emulator-5554`, and `com.alina.minemind/.MainActivity` launched into the Expo dev-client shell.
- Web locale metadata and core button/answer accessibility state improved.
- Round finalization persistence moved behind an idempotent `complete_room_round` database RPC.
- Direct execute grants were removed from internal scoring RPC helpers for public, anonymous, and authenticated roles; service role keeps execute access.
- Supabase shared Edge HTTP helper now rejects non-object JSON bodies before payloads reach function logic.
- `expo-image` is used for solo question illustrations.
- `useSoloRound` now groups result/classroom flow state in a reducer and no longer syncs the timer limit through a derived-state effect.
- Classroom lobby invite state now derives its initial scanned invite once instead of copying props through an effect.
- Onboarding form state now uses a reducer.
- README, test plan, and release plan updated to reflect `360` records and the new gates.

Verified after remediation:

- `npm run validate:release`: pass; includes tests, TypeScript, Expo Doctor, npm audit, Deno check for `11` Supabase Edge Function entrypoints, web export smoke for `/`, `/home`, `/solo`, `/rooms`, and `/classroom`, and the web bundle budget gate.
- Mobile web visual smoke: pass for seeded `/home`, `/solo`, and `/classroom` at `390x844`; no horizontal overflow detected.
- `npm run android:qa`: pass on `emulator-5554` after creating AVD `minemind_qa_api35`; app launch confirmed foreground `com.alina.minemind/expo.modules.devlauncher.launcher.DevLauncherActivity`.
- `npm run doctor:react:diff`: pass, `100/100`, no issues in the branch diff.
- `npm run doctor:react`: non-blocking full-repository score improved from `71/100` to `82/100`; remaining warnings are reviewed follow-up candidates, not branch-diff regressions.

## Verified Baseline

- `npm test`: pass, `163/163`.
- `npm run typecheck`: pass for app TypeScript.
- `npx expo export --platform web`: pass, exported `dist`.
- `npx tsx scripts/validate-question-bank.ts`: pass, `360` runtime Minecraft question records.
- `npx tsx scripts/validate-master-question-program.ts`: pass, `26` source entries, `72` slot records, `360` master records.
- `npx tsx scripts/lint-question-duplicates.ts`: pass.
- Browser smoke on exported app: root/onboarding/home/solo happy path works.

## Failed Or Weak Gates

- `npx -y expo-doctor@latest`: failed `1/19`; SDK 55 patch package mismatches.
- `npm audit --audit-level=moderate`: failed with `12` moderate vulnerabilities across `brace-expansion`, `postcss`, `uuid`, and `ws` transitive paths.
- `npx -y react-doctor@latest . --verbose`: score `71/100`, `65` findings, including `10` bug-class errors concentrated in `src/features/quiz/use-solo-round.ts`.
- `deno --version`: unavailable locally; Supabase Edge Functions are not typechecked by current toolchain.
- Static exported route reload: direct refresh on `/solo` returned `404` under a generic static server.

## Findings

### P1: Web Export Needs Route Fallback Before Web Release

Evidence:
- `dist` contains `index.html`, assets, and one JS bundle, but no per-route HTML files.
- Browser smoke proved `/` can redirect to `/home`, but refreshing `/solo` on the static artifact returned `404 The requested path could not be found`.

Impact:
- Web deep links, browser refresh, classroom invite links, and copied route URLs can break outside a dev server or host with SPA rewrites.

Fix:
- Configure hosting rewrites so all app routes serve `/index.html`, or change the export/deploy strategy to generate/serve route-aware output.
- Add a release smoke command that checks `/`, `/home`, `/solo`, `/rooms`, and `/classroom` against the production-style static server.

### P1: Dependency Health And Security Are Not Release-Clean

Evidence:
- `package.json` pins older SDK 55 patch ranges such as `expo@~55.0.18`, while Expo Doctor expects `~55.0.26`.
- `npm audit` reports `12` moderate vulnerabilities.
- `npm outdated --long` shows newer wanted versions for Expo SDK 55 packages and runtime libraries.

Impact:
- CI can pass while Expo Doctor and npm audit fail.
- Native/web builds may carry known transitive vulnerabilities and SDK patch drift.

Fix:
- Use current Expo SDK 55 patch expectations from `npx expo install --check` or `npx expo-doctor`, then update `package.json` and `package-lock.json`.
- Re-run `npm audit`; if Supabase `ws` remains, update `@supabase/supabase-js` within the current major and verify room realtime.
- Do not jump to Expo 56 in the same task unless native QA is scheduled.

### P1: CI Is Too Narrow

Evidence:
- `.github/workflows/ci.yml` runs only `npm run validate`.
- Current `validate` is `npm test && npm run typecheck && npx expo export --platform web`.

Impact:
- CI misses the known failed gates: Expo Doctor, npm audit, React Doctor score, direct-route web smoke, and Edge Function typecheck.

Fix:
- Add scripts for `doctor:expo`, `audit:security`, `doctor:react`, `check:edge`, and `smoke:web-export`.
- CI should run the release gate, not only the build gate.

### P1: `useSoloRound` Has Effect-Driven State Risks

Evidence:
- React Doctor reports missing effect dependencies, state synced from props, chained state updates, and event logic in effects in `src/features/quiz/use-solo-round.ts`.
- The timer effect calls `handleAnswer` but depends only on `[currentIndex, isRevealed, question]`.
- Classroom/room result flows set many related flags from effects and async callbacks.

Impact:
- Stale closures or effect ordering can create wrong timeout answers, duplicated finalization attempts, stuck pending states, or classroom result races.

Fix:
- Add regression tests for timeout submission, room finalization retry, and classroom host result publication.
- Refactor round UI state into a reducer or smaller hooks by mode: solo, live room, classroom.
- Stabilize event handlers with `useCallback` after removing duplicated derived state.
- Run React Doctor before/after and target zero bug-class errors.

### P1: Supabase Edge Functions Are Not Typechecked

Evidence:
- `tsconfig.json` excludes `supabase/functions` and `tests`.
- Deno is not installed locally.
- Existing tests include source-level assertions, but not a Deno compile/check gate.

Impact:
- Edge Function import, Deno type, or runtime payload mistakes can ship without `npm run typecheck` catching them.

Fix:
- Add Deno setup to CI and run `deno check` against Supabase function entrypoints and shared modules.
- Keep source-level contract tests, but treat them as regression tests, not typecheck replacement.

### P2: Finalization Should Be More Atomic And Idempotent

Evidence:
- `supabase/functions/finalize-round/index.ts` inserts results, then loops leaderboard RPC calls, then updates `round_sessions`, `rooms`, and `room_participants` in separate awaits.
- React Doctor also flags sequential awaits in this function.

Impact:
- A mid-finalization failure can leave a room partially finalized: results written but room status or ready states not reset.

Fix:
- Move finalization into one Postgres RPC transaction or make every step explicitly idempotent.
- Batch leaderboard updates in SQL or `Promise.all` only after idempotency is proven.
- Add tests for duplicate finalize calls and partial snapshot recovery.

### P2: Native QA Script Depends On Ignored Generated Folders

Evidence:
- `package.json` has `android:qa` as `cd android && ./gradlew...`.
- `.gitignore` ignores `/android` and `/ios`; `git ls-files android ios` returns no tracked native files.
- Local `android/` exists, but a clean checkout will not have it.

Impact:
- The documented Android QA command is not reproducible for a new worker or CI runner without an implicit prebuild step.

Fix:
- Either document `npx expo prebuild --platform android` as a required setup step or change the QA script to check/generate native files intentionally.
- Decide whether the project is managed Expo with generated native folders, or a prebuilt native project with tracked native code.

### P2: Web Accessibility And Metadata Need Work

Evidence:
- Browser DOM snapshots show most interactive React Native Web controls as `generic`, not semantic buttons.
- Home shows duplicate visible text `Грати соло` for card title and CTA.
- Exported `dist/index.html` has `lang="en"` while the default app locale and visible onboarding are Ukrainian.

Impact:
- Screen readers, keyboard navigation, and language-aware tooling may be poor on web.

Fix:
- Add `accessibilityRole`, `accessibilityLabel`, and keyboard focus checks to core pressables.
- Set or update `document.documentElement.lang` from app locale on web.
- Add an accessibility smoke test for visible route controls.

### P2: Bundle And Image Loading Need A Budget

Evidence:
- Web export JS bundle is about `4MB`; exported `dist` is about `19M`.
- `assets/question-illustrations` is about `7.7M`; individual images are roughly `0.5-0.8MB`.
- `app/solo.tsx` uses React Native `Image`, and React Doctor recommends `expo-image`.

Impact:
- First web load and mobile data usage can be heavy as the illustration set grows.

Fix:
- Use `expo-image` for caching/placeholders where compatible.
- Keep an asset budget and consider resizing/compressing illustrations.
- Avoid importing every future illustration into one eagerly loaded route module if the library grows.

### P3: Documentation Has Current-State Drift

Evidence:
- `README.md` says `60` active records; validators prove `360`.
- Release docs still list hosted Supabase credentials/native QA as pending, but do not reflect the new web route fallback and dependency audit gates.

Impact:
- Future workers may repeat stale assumptions or ship with incomplete release criteria.

Fix:
- Update README, test plan, and release plan after remediation.
- Keep this plan as the current Superpowers remediation source until a newer audit replaces it.

## Implementation Plan

### Task 1: Dependency And Gate Baseline

- [x] Create a branch for remediation.
- [x] Add scripts:
  - `doctor:expo`: `npx expo-doctor`
  - `audit:security`: `npm audit --audit-level=moderate`
  - `doctor:react`: `npx -y react-doctor@latest . --verbose`
  - `validate:release`: tests, typecheck, export, Expo Doctor, audit.
- [x] Run `npx expo install --check` and align all SDK 55 patch packages to current expected versions.
- [x] Update `package-lock.json` through npm/expo commands only.
- [x] Re-run `npm test`, `npm run typecheck`, `npx expo export --platform web`, `npx expo-doctor`, and `npm audit`.
- [x] If audit still reports Supabase `ws`, update `@supabase/supabase-js` within v2 and re-run live-room tests.

Exit criteria:
- Expo Doctor passes.
- npm audit has no moderate-or-higher findings, or documented remaining dev-only exceptions.
- CI has the new release gate.

### Task 2: Web Export Route Fallback

- [x] Decide target web host.
- [x] Add host rewrite config or deployment docs: all routes serve `/index.html`.
- [x] Add a `script/build_and_run.sh --serve-web` or npm script that serves `dist` with SPA fallback.
- [x] Add a smoke check for direct loads of `/`, `/home`, `/solo`, `/rooms`, and `/classroom`.
- [x] Verify production-style static serving of `/solo` no longer 404s under the new fallback smoke server.

Exit criteria:
- Production-style static serving supports route refresh/deep links.

### Task 3: Edge Function Typecheck And Hardening

- [x] Add Deno setup to CI.
- [x] Add a function check command for all Supabase function entrypoints and shared modules.
- [x] Add runtime payload validation helpers for Edge Function bodies.
- [x] Revoke unnecessary direct authenticated execute grants on internal scoring/leaderboard helpers unless a verified client path needs them.
- [x] Refactor round finalization into a transaction or proven idempotent sequence.
- [x] Add duplicate-finalize regression coverage and transaction source assertions.

Exit criteria:
- Edge Functions have a real typecheck gate.
- Finalization can be retried safely.

### Task 4: `useSoloRound` State Refactor

- [ ] Add focused tests for timer timeout, answer reveal, live-room pending retry, classroom host publish, and classroom guest finish.
- [x] Extract result/classroom flow state transitions into a reducer.
- [x] Replace safe derived-state effects for timer and initial classroom invite with direct initialization/reset points.
- [x] Stabilize the high-risk timer dependencies without changing gameplay behavior.
- [x] Re-run full test suite and React Doctor.

Exit criteria:
- React Doctor bug-class errors are resolved or documented as reviewed false positives.
- Existing gameplay behavior remains unchanged.

### Task 5: Native QA Reproducibility

- [x] Decide managed vs tracked native workflow.
- [x] If managed, change `android:qa` to verify or generate `android/` before running Gradle.
- [x] Keep native folders generated/ignored and document the managed Expo workflow.
- [x] Test Android dev-client install and launch path on a real emulator.
- [ ] Test classroom TCP with multiple Android devices or emulators on one LAN before production classroom rollout.
- [ ] Revisit New Architecture risk for `react-native-tcp-socket` before classroom LAN production testing.

Exit criteria:
- A clean checkout can run the documented Android QA path.

### Task 6: Web Accessibility, Locale Metadata, And Bundle Budget

- [x] Add web locale effect in root layout to set `document.documentElement.lang`.
- [x] Add semantic/accessibility labels for core buttons and pressables.
- [x] Remove ambiguous duplicate CTA labels or make accessible labels distinct.
- [x] Replace React Native `Image` with `expo-image` where appropriate.
- [x] Add an asset/bundle budget check after export.
- [x] Add mobile QA for long questions and first-screen CTA reachability.

Exit criteria:
- Web smoke shows semantic controls for primary actions.
- Bundle/assets stay within documented budget.

### Task 7: Documentation Refresh

- [x] Update README status from `60` to `360` question records.
- [x] Update release plan with web route fallback, dependency/security gate, Edge Function typecheck, and native QA workflow.
- [x] Update test plan with exact commands and expected pass/fail gates.

Exit criteria:
- Docs match the verified current state and no longer repeat stale Superpowers command assumptions.

## Recommended Order

1. Dependency/CI gates.
2. Web route fallback.
3. Edge Function typecheck and finalization hardening.
4. `useSoloRound` state refactor.
5. Native QA reproducibility.
6. Accessibility/performance.
7. Documentation cleanup.

This order fixes the gates first, then the highest-risk runtime logic, then release polish.
