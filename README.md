# MineMind

Mobile quiz app prototype for `iOS + Android` built with `Expo`, `React Native`, and `Supabase-first` architecture.

## Current Status
- guest onboarding
- localized UI: `uk`, `en`, `ru`
- solo Minecraft quiz flow with `easy / medium / hard`
- private room flow with live-Supabase integration path and demo fallback
- validated local Minecraft question bank with `360` active records
- Minecraft-inspired fantasy UI layer, difficulty badges, and reward framing
- room match settings foundation with `contentPackVersion` + difficulty metadata
- NEXUS-Full planning docs in `docs/`
- Supabase schema and Edge Function scaffolding in `supabase/`
- validation suite and CI workflow

## Commands
- `npm install`
- `npm run dev`
- `npm test`
- `npm run typecheck`
- `npm run validate`
- `npm run validate:release`
- `npm run doctor:expo`
- `npm run audit:security`
- `npm run check:edge`
- `npm run smoke:web-export`
- `npm run check:web-budget`
- `npx tsx scripts/validate-question-bank.ts`
- `npx tsx scripts/export-question-packs.ts`
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
```

If env vars are missing, the app still works in offline/demo mode.

## Next Active Wave
- connect hosted Supabase project credentials
- run native iOS runtime checks
- run internal testing with release metadata drafts
- keep release gates green: Expo Doctor, npm audit, Edge Function check, web route smoke, and web bundle budget

## Web Hosting

The production web target is Netlify static hosting. `netlify.toml` publishes `dist` and rewrites all routes to `/index.html` so Expo Router deep links and refreshes keep working.
