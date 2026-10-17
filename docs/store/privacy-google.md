# Google Play Console: Data safety answers

For MineMind 1.0. Keep this consistent with the privacy policy and with `privacy-apple.md`.

## Overview questions

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (HTTPS / WSS to Supabase, Expo and Sentry). Classroom-mode traffic stays on the local network between players' devices and is never sent to us, so it is not "collected". |
| Which account creation methods does your app support? | Anonymous / no username-password: pick the option for accounts created without user credentials, plus "OAuth / email link" if Play asks about the optional email magic link. |
| Do you provide a way for users to request that their data is deleted? | **Yes** |
| Delete account URL | `{{web}}/privacy?lang=en` (the "Your rights" section explains in-app deletion and deletion by email for people who no longer have the app). A dedicated `{{web}}/delete-account` page would be clearer if you make one. |
| In-app path | Settings → "Delete account and all data" (behind the parental gate). Deletes the account and all linked server data. |
| Shared data | **None.** Supabase, Expo and Sentry process data as service providers on our behalf, which Google does not count as sharing. Nothing goes to advertisers, analytics companies or data brokers. |
| Independent security review | No (optional badge). |
| Committed to the Play Families Policy | Yes (target audience includes children). |

## Data types collected

All are **collected**, **not shared**, **not processed ephemerally** unless noted.

| Google category → type | Required or optional | Purposes | What it is |
|---|---|---|---|
| Personal info → **User IDs** | Required | App functionality, Fraud prevention, security and compliance | Anonymous Supabase account id; also in rate-limit records. |
| Personal info → **Name** | Required | App functionality | Google's definition of Name includes nicknames. The in-game nickname (word lists or filtered), shown only to members of the same private room. |
| Personal info → **Email address** | **Optional** | App functionality, Account management | Only when a parent links one to save/restore progress (magic link). No marketing. |
| App activity → **Other actions** | Required | App functionality, Analytics, Personalization | Gameplay: preset avatar and language choice, room participation and ready state, answers in rooms (option, time left), match results and room leaderboards, progress (XP, level, achievements, cards, day streak, ids of wrong questions, recent results), solo answer stats (question id, correct, time). Analytics = first-party per-question difficulty totals, kept unlinked. Personalization = smart difficulty and "Fix your mistakes". |
| App activity → **Other user-generated content** | Optional | App functionality | Question reports: a reason from a fixed list + question id. No free text. (Alternative placement: "Other actions". Pick one.) |
| App info and performance → **Crash logs** | Required, only if Sentry is enabled | App functionality (stability) | Error message, stack trace. No name, email, nickname or account id. Remove this row if Sentry is off. |
| App info and performance → **Diagnostics** | Required, only if Sentry is enabled | App functionality | Platform tag and error context. Remove if Sentry is off. |

### Not collected
Location (approximate or precise), phone number, address, contacts, photos, videos, audio, files, calendar, messages (no chat, no SMS, no email reading), web browsing, installed apps, health, financial info, **Device or other IDs** (no Advertising ID, Android ID, IMEI, MAC, SSID/BSSID), app interactions/screen tracking, in-app search history.

Data on the device only (local profile, settings, recent matches), on-device speech (read-aloud) and on-device QR reading (if a scanner ships) are not collected because they never leave the device.

## Families policy self-check

- [x] Target audience: 6–8 and 9–12 only. App content is appropriate for children.
- [x] No ads, so no ad SDKs (self-certified or otherwise).
- [x] No Advertising ID; check the merged manifest for `com.google.android.gms.permission.AD_ID` and block it if a library adds it.
- [x] No location permission and no precise location.
- [x] No transmission of AAID, IMEI, IMSI, SIM/Build serial, MAC, SSID or BSSID. `ACCESS_WIFI_STATE` / multicast are used only to find classroom devices on the local network.
- [ ] Remove the unused `RECORD_AUDIO` permission (added by the expo-audio config plugin by default) before building.
- [x] SDKs suitable for child-directed services: Supabase, Expo; Sentry only if enabled, with no identifiers.
- [x] Privacy policy in the app and on the web; Data safety and IARC answers match it.
- [x] No chat, no free-text sharing, no public profiles; nicknames filtered.
- [x] Parental gate before outside links, email linking, sharing, data export and account deletion.
- [x] Account deletion in the app and via a web URL.
- [x] **Teacher Approved:** not applied. It is not something developers apply for; Google selects apps. Nothing to do.
