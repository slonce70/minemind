# Internal Testing Checklist

## Environment
- `EXPO_PUBLIC_SUPABASE_URL` is set
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` is set
- hosted Supabase project has schema and Edge Functions deployed
- `Xcode`, `Android Studio`, `watchman`, and `CocoaPods` are installed

## Validation Commands
- `npm test`
- `npm run typecheck`
- `npm run validate:content`
- `npm run check:edge`
- `npm run smoke:web-export`
- `npm run check:web-budget`
- `npm run validate`
- `npm run validate:release`

## Manual Smoke Checks
- onboarding completes with a safe nickname
- invalid nickname is rejected
- solo round loads and finishes
- room is created and code is shown
- second client can join by code
- ready toggle works
- host can start room match
- room participants receive the same question set
- final podium is shown after finalize

## Release Assets
- icon and splash finalized
- privacy policy URL prepared
- support email prepared
- screenshots captured
- metadata reviewed for non-official Minecraft positioning
