# MineMind

Mobile quiz app prototype for `iOS + Android` built with `Expo`, `React Native`, and `Supabase-first` architecture.

## Current Status
- guest onboarding
- localized UI: `uk`, `en`, `ru`
- solo Minecraft quiz flow
- private room flow with live-Supabase integration path and demo fallback
- NEXUS-Full planning docs in `docs/`
- Supabase schema and Edge Function scaffolding in `supabase/`
- validation suite and CI workflow

## Commands
- `npm install`
- `npm run dev`
- `npm test`
- `npm run typecheck`
- `npm run validate`
- `npx expo export --platform web`
- `./script/build_and_run.sh --help`
- `./script/build_and_run.sh --web`

## Environment
Copy `.env.example` to `.env.local` and fill in:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

If env vars are missing, the app still works in offline/demo mode.

## Next Active Wave
- connect hosted Supabase project credentials
- install native toolchain for iOS and Android runtime checks
- run internal testing with release metadata drafts
