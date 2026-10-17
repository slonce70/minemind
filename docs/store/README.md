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

## Before building

- expo-audio plugin: disable microphone and background playback permissions (details in `listing-settings.md`).
- Make sure no `AD_ID` permission ends up in the Android manifest.
