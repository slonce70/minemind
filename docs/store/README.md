# Store release texts

Drafts for the MineMind 1.0 store submission. Andrii reviews and submits them himself; nothing here is sent anywhere automatically.

## Files

| File | What it is |
|---|---|
| `metadata.uk.md`, `metadata.en.md`, `metadata.ru.md` | Name, subtitle, short description, promo text, keywords, long description, "What's new", screenshot captions, URLs. Character counts next to each limited field. |
| `listing-settings.md` | Categories, Apple age rating and Google IARC answers, Kids Category and Families settings, content rights, review notes. |
| `privacy-apple.md` | App Store Connect App Privacy answers and a Kids Category checklist. |
| `privacy-google.md` | Play Console Data safety answers and a Families policy self-check. |
| `../../src/features/legal/legal-content.ts` | Privacy policy and terms (uk/en/ru) shown in the app and on the web. |

## To fill in

| Placeholder | Where | What |
|---|---|---|
| `{{developer}}` | legal texts | Legal name of the operator (person or company) responsible for the data. |
| `{{email}}` | legal texts, support page | Contact address that is actually read; also used for deletion requests. |
| `{{region}}` | privacy policy | Supabase project region, e.g. "the EU (Frankfurt)". |
| `{{web}}` | metadata, store forms | Base URL of the website that serves `/privacy` and `/terms` with `?lang=uk|en|ru`, plus a support page. |
| Bundle id / package | App Store Connect, Play Console | `app.json` currently has `com.alina.minemind` for both platforms. Confirm or change before the first upload; it cannot be changed after. |

## To decide

- **Sentry on or off for the store build.** Recommended off for 1.0 (Kids Category). If on: set "Prevent storing of IP addresses", keep the Diagnostics rows in both privacy forms, update the review note.
- **Apple age rating 9+ vs 4+.** Honest answers to Apple's definitions (combat topic, sword icons) give 9+. See `listing-settings.md`.
- **Contests answer:** must be "Infrequent"; "Frequent" makes the app 13+.
- **Content rights:** "Yes, I have the rights" (recommended) or "No". Same answer in both stores.
- **Email provider for magic links:** if Supabase uses a custom SMTP service, add it to the privacy policy's processors section.
- **Settings labels:** the legal texts quote the button labels from `src/i18n/release-resources.ts` ("Download my data", "Delete account and all data" and their uk/ru versions). If those labels change, update `legal-content.ts` too.

## Already done in the app config

- expo-audio: no microphone or background playback permission. expo-camera: camera only (room QR), no microphone.
- Android `blockedPermissions` drops `AD_ID`, `RECORD_AUDIO`, storage and overlay permissions. Check the merged manifest of the first build anyway.

## Screenshots and preview video

`screenshots/<size>/<locale>/` holds six screens per language (uk, en, ru): home, picture question, recipe question, rewards, card collection, friend challenge. PNG, no alpha.

| Folder | Pixels | Store slot |
|---|---|---|
| `iphone-6.7` | 1290 × 2796 | App Store, iPhone 6.7" (also used for 6.9") |
| `iphone-6.5` | 1242 × 2688 | App Store, iPhone 6.5" |
| `ipad-12.9` | 2048 × 2732 | App Store, iPad 12.9"/13" |
| `android-phone` | 1080 × 1920 | Google Play, phone |
| `android-tablet` | 1600 × 2560 | Google Play, 10" tablet |

Captions for each screen are in `metadata.<locale>.md`; add them in the store's frame tool or leave the screens plain.

`video/preview-<locale>.mp4` is an App Preview (886 × 1920, 30 fps, 29 s, no sound): home, a "fix your mistakes" round with a picture and a recipe question, rewards on the results screen, the card collection. Apple accepts it as is for the 6.5"/6.7" slots. Google Play only takes a YouTube link, so upload one there yourself if you want it.

Regenerating (the content and the state are fixed, so the shots come out the same):

```bash
npm i --no-save playwright@1.58.2 && npx playwright install chromium
npx expo start --web --port 8081
npx tsx scripts/store/prepare.ts
node scripts/store/screenshots.mjs docs/store/screenshots
node scripts/store/video.mjs <out-dir> uk
```

The ffmpeg line that turns the recording into the mp4 is at the top of `scripts/store/video.mjs`.
