# Release Plan

## Before Internal Testing
- підключити hosted Supabase project
- заповнити `.env.local`
- зібрати іконки, splash, app name assets
- перевірити nickname filter
- пройти `npm run validate:release`
- перевірити exported web routes через `npm run smoke:web-export`
- перевірити web bundle/assets budget через `npm run check:web-budget`
- підтвердити, що Supabase Edge Functions проходять `npm run check:edge`
- підтвердити Android QA шлях через `npm run android:qa` на чистому checkout або після prebuild
- для web deploy використовувати Netlify config з `netlify.toml`, який публікує `dist` і переписує всі routes на `/index.html`
- classroom LAN режим не описувати як production-ready, доки `docs/13-internal-testing-checklist.md` не має записаних результатів для мінімум двох фізичних пристроїв

## Internal Testing
- iOS: TestFlight після Apple Developer enrollment
- Android: Play internal testing; локальний AVD debug install/launch уже перевіряє базову native install path, але Play Console testing лишається окремим release-кроком

## Metadata
- app description
- screenshots
- privacy policy URL
- support email
- content disclosures

## Supporting Drafts
- `docs/11-privacy-policy-draft.md`
- `docs/12-store-metadata-draft.md`
- `docs/13-internal-testing-checklist.md`

## Launch Rule
- публічний матчмейкінг не відкривати до стабільного retention і room reliability
