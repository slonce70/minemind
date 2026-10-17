# Release checklist (1.0.0)

Nothing here is automated against the stores: every upload, submission and review answer is done
by hand. Work top to bottom; each step names the command or the place.

## 1. Backend (hosted Supabase)
- [ ] Apply all migrations in order: `npx supabase db push` (phases 0–4, up to `20261018100000_question_reports.sql`).
- [ ] Load the question bank: `npm run export:content`, then run `supabase/seed.sql` against the project.
- [ ] Deploy every Edge Function: `npx supabase functions deploy` (16 functions, including `report-answers`, `report-question`, `export-my-data`, `delete-account`).
- [ ] Auth: anonymous sign-ins on; email provider on with confirmations; custom SMTP (Supabase's built-in mailer is rate limited); redirect URLs `<web>/auth` and `minemind://auth`.
- [ ] Optional: `pg_cron` for `close_abandoned_rooms` (see `20261017120000_room_limits.sql`).

## 2. Build environment (EAS → Environment variables, per environment)
| Variable | development | preview | production |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` | staging or hosted | hosted | hosted |
| `EXPO_PUBLIC_WEB_URL` | optional | hosted web app | hosted web app |
| `EXPO_PUBLIC_CONTACT_EMAIL`, `EXPO_PUBLIC_LEGAL_DEVELOPER`, `EXPO_PUBLIC_DATA_REGION` | optional | yes | **required** |
| `EXPO_PUBLIC_SENTRY_DSN` | optional | optional | leave empty for the Kids category build |

Production builds stop if any required value is missing (`scripts/check-release-env.mjs`, run by the
`eas-build-post-install` hook). Check locally with `npm run check:release-env`.

## 3. Identity and versions
- [ ] Confirm the bundle id / package (`app.json`: `com.alina.minemind`). It cannot change after the first upload.
- [ ] `app.json` `version` is the store version (1.0.0). `ios.buildNumber` / `android.versionCode` start at 1;
      the production profile bumps them on every build (`autoIncrement`, `appVersionSource: local`) — commit the bump.
- [ ] `runtimeVersion` follows the app version, so OTA updates only reach builds of the same version (see `ota-updates.md`).

## 4. Gates (all green before any build)
- [ ] `npm run validate:release` (tests, types, lint, content, doctor, audit, edge, web smoke, bundle budget)
- [ ] `npm run test:e2e` against a local stack (`npx supabase start`, `npx supabase functions serve`)
- [ ] Brand: `tests/brand.test.ts` passes; screenshots in `docs/store/screenshots` show no trademark

## 5. Builds
- [ ] `eas build --profile preview --platform all` → install on real devices, run `beta-testing.md`.
- [ ] `eas build --profile production --platform all`.

## 6. Store listings (by hand)
- [ ] Texts: `docs/store/metadata.{uk,en,ru}.md`; settings and ratings: `docs/store/listing-settings.md`.
- [ ] Privacy: `docs/store/privacy-apple.md` (App Privacy), `docs/store/privacy-google.md` (Data safety).
- [ ] Privacy and terms URLs: `<web>/privacy?lang=uk|en|ru`, `<web>/terms?lang=…` (deploy the web export first).
- [ ] Screenshots: `docs/store/screenshots/<size>/<locale>/`; preview video `docs/store/video/`.
- [ ] Review notes: in `docs/store/listing-settings.md`.

## 7. Web
- [ ] `npm run export:web`, deploy `dist` to Netlify (`netlify.toml` rewrites routes to `index.html`).
- [ ] Open `/privacy`, `/terms`, `/challenge?...` on the hosted URL.

## 8. After launch
- [ ] Watch Supabase logs and (if on) Sentry for the first days.
- [ ] Weekly: `npx tsx scripts/list-question-reports.ts` and `npx tsx scripts/suggest-difficulty.ts` (`docs/release/liveops.md`).
