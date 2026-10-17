# Store listing settings (App Store Connect and Google Play Console)

Draft answers for MineMind 1.0. Check each one against the build you actually submit.

## 1. Categories

### App Store
- **Primary category:** Games, subcategories **Trivia** and **Family**. The app is a quiz game with rounds, scores and rooms; Trivia is where people look for quizzes, Family matches the big-screen and classroom play.
- **Secondary category:** **Education**. The questions teach facts and the classroom / big-screen modes are built for lessons. Do not make Education primary: the core loop is a game, and a wrong primary category is a review reason (Guideline 2.3.5).
- **Kids Category:** yes, via the **Made for Kids** checkbox, age band **9–11** (see section 3). This is separate from primary/secondary categories.

### Google Play
- **App type:** Game. **Category:** **Trivia**.
- **Tags (up to 5):** pick from Play's list the closest to Trivia, Quiz, Educational, Family, Multiplayer.
- Rationale: same as above. "Educational" category on Play is for apps and games whose main purpose is learning; MineMind is a quiz game first.

## 2. Age ratings

### Apple age rating questionnaire (2025 form)

| Item | Answer | Why |
|---|---|---|
| Parental Controls | No | The parental gate protects links, email, sharing, export and deletion, but there are no parent settings to monitor or restrict play. Either answer stays at 4+. |
| Age Assurance | No | No age check. |
| Unrestricted Web Access | No | No in-app browser; the few outside links open only behind the parental gate. |
| User-Generated Content | No | Nothing is broadly distributed. Nicknames (word lists or filtered) and preset avatars are visible only to members of a private room. |
| Social Media | No | |
| Messaging and Chat | No | No chat, no free text between players. |
| Advertising | No | |
| Profanity or Crude Humor | None | |
| Horror/Fear Themes | None | Mobs are pixel-art game creatures, no scary content. |
| Alcohol, Tobacco, or Drug Use or References | None | Questions about in-game potions are fantasy items, not substances. |
| Medical or Treatment Information | None | |
| Health or Wellness Topics | No | |
| Mature or Suggestive Themes | None | |
| Sexual Content or Nudity / Graphic | None | |
| **Cartoon or Fantasy Violence** | **Infrequent** | The "Mobs and combat" topic asks about fighting game monsters (damage, which mob attacks, etc.). Text only, but it is a reference to fantasy combat. |
| Realistic Violence / Prolonged Graphic Violence | None | |
| **Guns or Other Weapons** | **Infrequent** | Apple's definition includes "references to or depictions of ... swords". The app has sword pixel icons (topic, challenge panel) and questions about swords and bows. |
| Gambling / Simulated Gambling | No / None | |
| Contests | **Infrequent** | Trivia counts as a contest. Rooms are private and have no prizes; solo rounds are personal goals. **Do not answer "Frequent": that alone makes the app 13+ and kills the Kids Category.** |
| Loot Boxes | No | Cards are random rewards for playing, but nothing is ever sold, so this is not a loot box under Apple's definition ("for purchase"). |
| Made for Kids | Yes, 9–11 | |

**Expected result: 9+, not 4+.** The two "Infrequent" answers (fantasy violence, weapons) are what Apple's definitions honestly require for a quiz with a combat topic and sword icons. 4+ would need both answered "None", which is only defensible if the combat questions and sword art were removed. 9+ fits the 9–11 Kids band (confirm App Store Connect accepts the pair before submitting).

### Google Play IARC questionnaire

| Question group | Answer | Note |
|---|---|---|
| Category | Game | |
| Violence | No depicted violence | Combat is only mentioned in question text; nobody is shown being hurt. If you decide a picture question shows harm, answer "fantasy violence, mild": still Everyone, possibly PEGI 7. |
| Fear, sexuality, language, controlled substances, crude humor | No | |
| Gambling (real or simulated) | No | |
| Users interact or exchange content (voice, text, images) | No | No chat or free text. Nickname + preset avatar is shown only inside private rooms. Answering Yes would only add the "Users Interact" notice, not change the age. |
| Shares user's physical location | No | |
| Digital purchases | No | |
| Random items for purchase | No | |
| Unrestricted internet / web browser | No | |

**Expected result:** ESRB Everyone, PEGI 3, USK 0, ClassInd L, ACB G (other regions equivalent).

## 3. Apple Kids Category: recommended

Join it. The audience is 8–12, the app already has no ads, purchases or chat, and Kids placement is the honest place for it. Choose age band **9–11**. Note Guideline 2.3.8: words like "for kids" in metadata are allowed only in the Kids Category, so the long description's "for kids" lines must go if you opt out.

Rules it imposes (Guidelines 1.3 and 5.1.4) and how MineMind meets them:

| Rule | How MineMind meets it |
|---|---|
| No links out, purchases or other distractions unless behind a parental gate | Parental gate (arithmetic question for an adult) in front of outside links, email linking, sharing (challenge link, room invite), data export and account deletion. No purchases at all. Privacy policy and terms are shown inside the app. |
| No third-party advertising | None. |
| No third-party analytics; no personal or device info to third parties | No analytics SDKs. Supabase (backend) and Expo (update delivery) act as service providers on our behalf. **Sentry:** keep `EXPO_PUBLIC_SENTRY_DSN` unset in the Kids release build. If you need it, it must send no identifiers (it doesn't: error, stack, platform only), turn on "Prevent storing of IP addresses" in Sentry, and say so in the review notes. Safest for 1.0: off. |
| Comply with COPPA, GDPR and similar | No personal info required; anonymous account; email only added by a parent through the gate; in-app export and deletion; privacy policy in app and on the web. |
| Privacy policy | In app (Settings) and at `{{web}}/privacy?lang=xx`. |
| Requirements stay after leaving the Kids Category | Plan future features with this in mind (no ads SDK, no chat). |

Build checks before submitting (not text changes, but they affect review):
- `expo-audio` config plugin by default adds `NSMicrophoneUsageDescription`, Android `RECORD_AUDIO` and background-audio permissions. The app never records. Pass plugin options `{ "microphonePermission": false, "recordAudioAndroid": false, "enableBackgroundPlayback": false }` (or block the permissions) so a kids app does not ship an unused microphone permission.
- No AdSupport / App Tracking Transparency; no IDFA.
- The room QR scanner uses the camera (expo-camera, asked only when the player taps "Scan QR code"); the usage string says the picture stays on the device. No microphone.

## 4. Google Play: target audience and Families

- **Target age groups:** **6–8** and **9–12** (the audience is 8–12). Do not add 13+ groups: the app is designed for children, so it falls fully under the Families policy, which it already meets.
- **Ads:** "Does your app contain ads?" **No**.
- **Families policy self-check:**
  - No Advertising ID: make sure the merged manifest has no `com.google.android.gms.permission.AD_ID` (add it to `android.blockedPermissions` if any library pulls it in).
  - No location permission, no precise location.
  - No transmission of hardware/network identifiers (IMEI, MAC, SSID, BSSID, serials). Classroom mode uses `ACCESS_WIFI_STATE` / multicast for local discovery only; the code does not read or send SSID/BSSID.
  - Only SDKs appropriate for child-directed services: Supabase, Expo; Sentry only if enabled (no identifiers).
  - No unused sensitive permissions: remove `RECORD_AUDIO` (see expo-audio note above).
  - Data safety, target audience and IARC answers consistent with each other and with the privacy policy.
  - Privacy policy URL set; account deletion URL set (`{{web}}/privacy?lang=en`).
- **Teacher Approved:** not applied for. Google picks apps for it; there is nothing to submit.

## 5. Content rights

- **App Store Connect → Content Rights:** "Does your app contain, show, or access third-party content?" **Yes**, and "I have the rights": the questions refer to names and facts from a third-party game. That use is descriptive (facts about a game are not owned content), no game assets are copied, every picture, sound and piece of music is original (see `assets/LICENSES.md`), and the unofficial-fan disclaimer is in the app and the description. If you read the question as "copyrighted assets only", **No** is also defensible; pick one and keep it consistent across both stores.
- **Google Play → App content → Content rights / ownership:** same answer and reasoning.
- Name, subtitle, icon, keywords and screenshots never use "Minecraft"; the long description mentions it once, followed by the disclaimer.

## 6. Review notes

### App Store (App Review Information → Notes)

```text
MineMind needs no login and no demo account. On first launch the app signs in anonymously (Supabase anonymous auth) and asks only for a nickname (built from word lists or typed and filtered) and a preset avatar.

Parental gate: a simple arithmetic question for an adult appears before outside links, linking an email, sharing, downloading data and deleting the account.

Solo: Home → play a round (8 questions, timer). Other modes (by topic, smart difficulty, fix your mistakes) are on the home screen.

Private rooms (needs two devices, e.g. an iPhone and a simulator):
1. Device A: Home → Play with friends → Create room. A 6-character code appears.
2. Device B: Play with friends → Join by code → enter the code → Ready.
3. Device A: Start room battle.
Big screen: in the room lobby on Device A (host), switch on "Big screen" before starting. Device A then only shows the questions (for a TV/projector); join and answer from Device B.
Classroom mode: Home → Classroom local play. Both devices must be on the same Wi-Fi; iOS asks for Local Network permission.
Friend challenge: finish a solo round → Challenge a friend (parental gate) → share the link. Opening the link on another device plays the same 8 questions.

Account deletion: Settings → Delete account and all data (parental gate). Data export: Settings → Download my data.

No ads, no in-app purchases, no chat, no third-party analytics or tracking. Crash reporting is disabled in this build.

MineMind is an unofficial fan quiz, not affiliated with Mojang or Microsoft. All art, sounds and music are original. The disclaimer is shown in the app and in the description.
```

(If Sentry is enabled in the submitted build, replace "Crash reporting is disabled in this build." with: "Error reports go to Sentry without any user identifier, name, email or nickname; IP storage is disabled.")

### Google Play (App access)

- **App access:** "All functionality is available without special access." No credentials needed.
- Notes field (if asked): reuse the App Store text above, replacing "an iPhone and a simulator" with "two Android devices or an emulator", and the Local Network permission line with "both devices on the same Wi-Fi".
