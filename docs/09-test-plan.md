# Test Plan

## Functional
- onboarding з валідним ніком переводить на home
- invalid nickname блокується
- solo round дає 8 питань
- таймер працює
- правильна відповідь дає score
- тайм-аут не ламає flow
- results screen показує score, streak, correct answers

## Localization
- `uk`, `en`, `ru` перемикаються з onboarding
- довгі рядки не ламають layout

## Backend Readiness
- без env змінних app працює в offline mode
- з env змінними app може ініціалізувати anonymous auth

## Multiplayer Readiness
- room schema і function stubs існують
- realtime strategy описана в docs

## Release Checks
- `npm run typecheck`
- `npm run validate:content`
- `npm test`
- `npm run doctor:expo`
- `npm run audit:security`
- `npm run check:edge`
- `npm run smoke:web-export`
- `npm run check:web-budget`
- `npm run validate:release`
- smoke-run через Expo або exported web artifact
- privacy policy draft
- app metadata draft

### Web export route smoke

Use `npm run smoke:web-export` before web release. It exports the web build and serves the artifact with app-route fallback, then checks direct loads for `/`, `/home`, `/solo`, `/rooms`, and `/classroom`.

Use `npm run serve:web-export` or `./script/build_and_run.sh --serve-web` to inspect `dist` manually after `npm run export:web`.

### Web export budget

Use `npm run check:web-budget` after `npm run export:web`. Current budgets are:

- web entry bundle: `4.5 MiB`
- full exported `dist`: `21 MiB`
- mirrored question illustrations: `8 MiB`

The release gate runs this after `npm run smoke:web-export`.

### Supabase Edge Function check

Use `npm run check:edge` to run Deno checks across all Supabase Edge Function entrypoints. This is separate from `npm run typecheck`, because the app TypeScript config excludes `supabase/functions`.

The shared Edge HTTP helper rejects non-object JSON bodies so functions do not silently accept arrays or primitive payloads.

### Content authoring gate

Use `npm run validate:content` before release validation and after any content-bank change. It validates the runtime question bank, validates the master question program, and runs duplicate lint so `content/minecraft/minecraft-question-bank.v1.json` stays aligned with the localized master bank.

### Android emulator smoke test

Use `npm run android:qa` for local emulator installs. It regenerates the ignored `android/` project with Expo prebuild when needed, then limits the native build to the emulator ABI and avoids the much slower all-ABI debug build.

The 2026-06-06 verification created `minemind_qa_api35` from the installed `system-images;android-35;google_apis;arm64-v8a` image, installed the debug APK on `emulator-5554`, and launched `com.alina.minemind/.MainActivity`.

### Mobile web visual smoke

For mobile web inspection, serve the exported app and use a `390x844` viewport. Seed `minemind-store` with a profile before protected routes. The 2026-06-06 smoke checked `/home`, `/solo`, and `/classroom` for rendered text, semantic buttons, and `overflowX: 0`, with screenshots saved under `/tmp/minemind-*-seeded-mobile.png`.

### React Doctor maintainability triage

Use `npm run doctor:react` for full-repository maintainability review and `npm run doctor:react:diff` before PR handoff. Current reviewed classifications live in `docs/14-maintainability-triage.md`; do not delete Supabase Edge Function entrypoints or change live-room finalization polling based only on static analyzer output.
