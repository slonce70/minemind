# Over-the-air updates (expo-updates)

- `app.json`: `updates.url` points at the EAS project; `runtimeVersion.policy = appVersion`, so a
  JS update only reaches builds with the same `version`. Native changes (new modules, permissions,
  config plugins) need a new store build and a new `version`.
- Channels match the build profiles in `eas.json`: `development`, `preview`, `production`.
- The app checks on launch (`checkAutomatically: ON_LOAD`) and applies a downloaded update on the
  next launch (`fallbackToCacheTimeout: 0`), so start-up never waits for the network.

## Publishing (by hand)
```bash
eas update --channel preview --message "Fix room timer text"
```
Test on preview builds first, then publish the same commit to `production`.
Roll back with `eas update:republish` (previous group) or `eas update:rollback`.

## What may ship over the air
- Texts, fixes in JS/TS, new questions (the bank is bundled JS), styles.
- Not: new permissions, new native modules, app icon/splash, anything that needs store review notes
  to change. Store rules forbid changing the app's purpose through OTA.
