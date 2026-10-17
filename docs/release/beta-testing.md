# Beta testing (TestFlight and Play internal testing)

Uploads and tester invitations are done by hand; nothing in the repo submits builds.

## Getting a build to testers
- iOS: `eas build --profile production --platform ios`, upload the `.ipa` in Transporter (or
  `eas submit` run by hand when ready), add internal testers in App Store Connect → TestFlight.
  Kids category apps still go through TestFlight beta review for external testers.
- Android: `eas build --profile production --platform android`, upload the `.aab` to Play Console →
  Testing → Internal testing, add testers by email list. For quick device checks without the store,
  the `preview` profile builds an installable APK.

## Who
- 3–5 families with kids 8–12 (parents install, kids play), one teacher for the big screen and classroom modes.
- Devices: at least one small iPhone, one iPad, one low-end Android phone, one Android tablet.

## Test script (one session, ~30 minutes)
1. Onboarding: warm-up, nickname dice, avatar. Language switch in Settings.
2. Solo: one classic round on each difficulty; a topic round; hints 50/50 and +10 s; smart difficulty; work on mistakes after a few wrong answers.
3. Question types: true/false, picture, recipe grid show and read aloud correctly.
4. Rewards: XP, level bar, daily quest, card drop; collection screen.
5. Rooms: create, join by code on a second device, ready, start; leave and rejoin mid-round.
6. Big screen: host toggles "Big screen" on a tablet/TV browser, two phones play, standings show.
7. Classroom (LAN): host and guest on the same Wi-Fi.
8. Challenge: share a challenge (parental gate appears), open the link on another device, compare.
9. Parents: email link and restore on a second device; Download my data; Delete account (on a test account).
10. Report a question from the answer card.
11. Offline: airplane mode — solo still works; progress syncs after reconnecting.
12. OTA: publish a preview update (`ota-updates.md`), relaunch twice, see the change.

## What to collect
- Crashes and freezes (device, steps), confusing texts (screenshot), wrong questions (use the in-app
  report), timing problems in rooms, anything a child could not do alone.
- Track findings as GitHub issues; content mistakes with the "Question error" template.

## Exit criteria
- No crash or data-loss bug open; rooms finish reliably with 4+ players; parental gate understood by
  parents and not passed by kids in the session; all three languages read naturally.
