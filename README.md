# MineMind

Mobile quiz app prototype for `iOS + Android` built with `Expo`, `React Native`, and `Supabase-first` architecture.

MineMind is a mobile quiz app for iOS and Android, built with Expo and React Native in TypeScript on top of a Supabase-first backend that leans on Postgres, Edge Functions, and Realtime. The UI is fully localized across Ukrainian, English, and Russian, and questions are drawn from a validated content bank of 1143 items organized into difficulty tiers. You can play through a solo mode or join private live multiplayer rooms, while solo and classroom play keep working without a backend.

## Current Status
- guest onboarding
- localized UI: `uk`, `en`, `ru`
- solo Minecraft quiz flow with `easy / medium / hard`
- private room flow on Supabase (bots and offline demo rooms exist only in development builds):
  - one server timeline for everyone: 5 s countdown, then each question opens for its timer and is followed by 10 s of answer and standings; questions are handed out only as they open, answers are timed by the server
  - every player reads the round in their own language (`question_translations`), answers are checked by option position
  - realtime room channel `room:<id>` (members only): room updates, who is online (Presence) and who answered; polling is only a fallback
  - limits: 8 players per room, rate limits on creating and joining rooms, rooms idle for 2 hours are closed (never deleted), a reconnecting player continues where they left off
  - Edge Functions answer errors as `{ code, error }`; the app shows the code translated
- classroom (LAN) matches where the host keeps the answers
- validated local question bank: `1143` active records in `uk`, `en`, `ru` (376 easy, 388 medium, 379 hard; 139–148 per topic), including 45 true/false, 18 picture and 20 recipe questions; answer options shuffled every round. On the web the bank loads as a separate chunk
- one scoring rule for every mode: `100 + 6 × seconds left`, times `×1 / ×1.25 / ×1.5` for `easy / medium / hard` (timers `20 / 18 / 15` s), defined in `supabase/functions/_shared/game-rules.ts`
- original pixel art direction: Tiny5 pixel headings and Nunito text (both OFL), hand-drawn pixel icons, the Kubik mascot and 14 avatars, all in code; app icon and splash rendered from the mascot (`scripts/generate-app-icons.ts`). Every asset and license is listed in `assets/LICENSES.md`
- game feel: Reanimated animations (question entrance, answer pop and shake, timer bar, score count-up), synthesised sound effects and music loop (`scripts/generate-sounds.ts`), haptics; sound, music and vibration switches in Settings. Animations follow the system reduce-motion setting
- onboarding with a three-question warm-up, then a word nickname (adjective + noun, dice for another) and avatar; nickname filter blocks reserved words only as whole words (`supabase/functions/_shared/nickname-rules.ts`, mirrored in SQL)
- results review all questions with your answer and the right one; profile screen with stats from recent matches; settings screen
- accessibility: roles and labels on every control, answers marked with a check or cross (never colour alone), text contrast held at WCAG AA by a test, question read-aloud (`expo-speech`), centred content column and two-column layouts on tablets
- progression: XP, levels and ranks (wood → netherite), day streak that survives time-zone changes, daily quest, 19 achievements and a collection of 24 original Kubik cards; rewards animate on the results screen
- cloud save of progress in Supabase (`player_progress`, owner-only RLS), offline-first with merge toward the bigger progress; the guest account can be linked to an email (magic link) and restored on another device
- solo modes: by topic, smart difficulty, fix your mistakes, friend challenge by link (same seed and questions, results compared); 50/50 and +10 s hints, once per round, cost points
- question types: multiple choice, true/false, picture and 3×3 recipe grid, drawn with original pixel items
- answer statistics on the server and `scripts/suggest-difficulty.ts` for recalibrating difficulty
- big screen rooms: the host's device (TV, projector) shows the question, timer, answer and standings; players answer on their phones
- room match settings foundation with `contentPackVersion` + difficulty metadata
- NEXUS-Full planning docs in `docs/`
- Supabase schema and Edge Function scaffolding in `supabase/`
- validation suite and CI workflow

## Commands
- `npm install`
- `npm run dev`
- `npm test`
- `npm run test:e2e` (Edge Functions against a local Supabase, see below)
- `npm run typecheck`
- `npm run validate:content`
- `npm run validate`
- `npm run validate:release`
- `npm run doctor:expo`
- `npm run audit:security`
- `npm run check:edge`
- `npm run smoke:web-export`
- `npm run check:web-budget`
- `npx tsx scripts/validate-question-bank.ts`
- `npx tsx scripts/export-question-packs.ts`
- `npm run export:content` (master bank → runtime bank → `supabase/seed.sql`)
- `npm run export:web`
- `npm run serve:web-export`
- `./script/build_and_run.sh --help`
- `./script/build_and_run.sh --web`
- `./script/build_and_run.sh --serve-web`

## Environment
Copy `.env.example` to `.env.local` and fill in:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
# Optional: error reporting to a Sentry DSN. Empty = off.
EXPO_PUBLIC_SENTRY_DSN=
# Optional: hosted web app address for friend challenge links. Empty = current page, or minemind:// on phones.
EXPO_PUBLIC_WEB_URL=
```

If env vars are missing, solo and classroom play still work offline. Online rooms need Supabase; in development builds an offline demo room with bots is available for testing the flow.

### Local Supabase

`supabase start` applies `supabase/migrations` and loads `supabase/seed.sql`, which is generated from the content bank by `npm run export:content`: one language-neutral pack per difficulty, each question once with its uk/en/ru translations, upserted by slug and content id (it never deletes rows; the first release's per-locale packs are only deactivated). Load the same seed into a hosted project before enabling online play there.

End-to-end tests of the Edge Functions run against that local stack and refuse any other URL:

```bash
npx supabase start
npx supabase functions serve
npm run test:e2e
```

CI does the same in the `e2e` job.

## Screenshots

Before and after Phase 2 ("game feel"): `docs/screenshots/phase-2/`. Phase 3 (progress, modes, question types): `docs/screenshots/phase-3/`.

## Next Active Wave
- connect hosted Supabase project credentials
- run native iOS runtime checks
- run internal testing with release metadata drafts
- keep release gates green: Expo Doctor, npm audit, Edge Function check, web route smoke, and web bundle budget

## Web Hosting

The production web target is Netlify static hosting. `netlify.toml` publishes `dist` and rewrites all routes to `/index.html` so Expo Router deep links and refreshes keep working.

## Disclaimer

MineMind is an unofficial fan-made quiz app. It is not affiliated with, endorsed by, or sponsored by Mojang Synergies AB or Microsoft. Minecraft is a trademark of Mojang Synergies AB.
