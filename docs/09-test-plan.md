# Test Plan

## Functional
- onboarding з валідним ніком переводить на home
- invalid nickname блокується
- solo round дає 8 питань
- таймер працює
- правильна відповідь дає score
- тайм-аут не ламає flow
- results screen показує score, streak, correct answers

## Localization
- `uk`, `en`, `ru` перемикаються з onboarding
- довгі рядки не ламають layout

## Backend Readiness
- без env змінних app працює в offline mode
- з env змінними app може ініціалізувати anonymous auth

## Multiplayer Readiness
- room schema і function stubs існують
- realtime strategy описана в docs

## Release Checks
- `npm run typecheck`
- smoke-run через Expo
- privacy policy draft
- app metadata draft

### Android emulator smoke test

Use `npm run android:qa` for local emulator installs. It limits the native build to the emulator ABI and avoids the much slower all-ABI debug build.
