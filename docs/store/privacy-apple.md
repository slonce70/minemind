# App Store Connect: App Privacy answers

For MineMind 1.0. "Data Used to Track You": **none** for every type. The app has no IDFA, no App Tracking Transparency prompt and no data broker or ad network.

First question, "Do you or your third-party partners collect data from this app?": **Yes**.

Supabase (backend) and Expo (update delivery) are service providers acting for us; data they handle for us still counts as collected by us. Data that stays on the device (local profile, settings, recent matches), classroom-mode traffic between devices on the local network, on-device speech and on-device QR reading are **not** "collected" in Apple's sense (never sent to us or a partner).

## Data types

| Apple data type | Collected | Linked to the user | Tracking | Purposes | What it is in MineMind |
|---|---|---|---|---|---|
| **Identifiers → User ID** | Yes | Yes | No | App Functionality | Anonymous Supabase account id, created automatically. Also used in rate-limit records (abuse prevention counts as App Functionality). |
| Identifiers → Device ID | No | | | | No IDFA/IDFV or hardware ids are sent. |
| **Contact Info → Email Address** | Yes (optional) | Yes | No | App Functionality | Only if a parent links one for save/restore (magic link). Used only to sign in. Apple's label has no "optional" flag; mention it in the privacy policy (done). |
| Contact Info → Name | No | | | | See note on nicknames below. |
| **User Content → Gameplay Content** | Yes | Yes | No | App Functionality, Product Personalization, Analytics | Nickname, preset avatar, interface language; room participation, ready state, answers in rooms (option, time left), match results and room leaderboards; progress (XP, level, achievements, cards, day streak, ids of wrong questions, recent answer results); solo answer stats (question id, correct, time). Personalization = smart difficulty and "Fix your mistakes". Analytics = first-party per-question difficulty totals (kept unlinked on the server). |
| **User Content → Customer Support** | Yes | Yes | No | App Functionality | Question reports: a reason picked from a list + question id + account id. No free text. If you see reports as gameplay feedback rather than support, "Other User Content" is the alternative; do not declare both. |
| User Content → Other User Content | No | | | | Nicknames are covered by Gameplay Content. |
| Usage Data → Product Interaction | No | | | | No taps/screens/session tracking. Answer statistics are declared as Gameplay Content. If you prefer to over-disclose, adding it does no harm, but the purposes must match. |
| Usage Data → Advertising Data | No | | | | |
| **Diagnostics → Crash Data** | Only if Sentry is on | No | No | App Functionality | Error message and stack trace. No user id, name, email or nickname. Turn on "Prevent storing of IP addresses" in Sentry. |
| **Diagnostics → Other Diagnostic Data** | Only if Sentry is on | No | No | App Functionality | Platform tag (iOS/Android/web) and error context. |
| Diagnostics → Performance Data | No | | | | |
| Location, Contacts, Health, Financial, Sensitive Info, Browsing/Search History, Purchases, Photos or Videos, Audio, Body, Surroundings | No | | | | The room QR scanner processes the camera image on the device only and never sends it. |

**If Sentry stays off** (recommended for the Kids Category build): remove both Diagnostics rows. The final label then shows: **Data Linked to You:** Identifiers (User ID), Contact Info (Email Address), User Content (Gameplay Content, Customer Support). **Data Not Linked to You:** nothing. **Data Used to Track You:** nothing.

Note on nicknames: Apple's "Name" means a real first or last name. A game nickname from word lists or a filtered short label is gameplay identity, so it sits under Gameplay Content. If App Review questions it, moving it to "Name" (linked, App Functionality) is the conservative fallback.

Note on IP addresses: Supabase and Expo receive the device IP while serving requests, as any server does. Apple does not ask to declare IP addresses unless they are used to derive location or for another listed purpose; MineMind does neither.

## Kids Category checklist

- [ ] Made for Kids checked, age band 9–11, age rating answers as in `listing-settings.md` (expected 9+).
- [ ] No third-party advertising SDKs in the binary.
- [ ] No third-party analytics SDKs. Sentry DSN unset in the release build, or justified in review notes with no identifiers and IP storage off.
- [ ] No IDFA, no AdSupport framework, no ATT prompt.
- [ ] Parental gate in front of: outside links, email linking, sharing (room invite, challenge link), data export, account deletion. Check every `Linking.openURL` and share-sheet call in the build.
- [ ] No purchases of any kind.
- [ ] No unused permission strings: microphone removed from the expo-audio plugin config; Local Network string present and friendly; camera string for the room QR scanner only (no microphone).
- [ ] Privacy policy reachable in the app (Settings) and at `{{web}}/privacy?lang=xx`; App Privacy answers match it.
- [ ] Account deletion in the app (Settings → "Delete account and all data"), not only by email (Guideline 5.1.1(v)).
- [ ] Metadata: "for kids" wording only because the app is in the Kids Category; no "Minecraft" in name, subtitle, keywords, icon or screenshots.
- [ ] Email sending for magic links: if Supabase uses a custom SMTP provider, that provider is a processor; list it in the privacy policy.
