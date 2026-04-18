# Local Setup

## Already Available
- `Node 24`
- `npm`
- `git`
- `Homebrew`
- `adb`
- `Java 21`

## Still Required On Mac
- `Xcode` full install
- `Android Studio`
- `watchman`
- `CocoaPods`

## Optional But Useful
- `EAS CLI`
- `Supabase CLI`

## Install Hints
- `brew install watchman`
- `sudo gem install cocoapods`
- `npm install -g eas-cli`
- `brew install supabase/tap/supabase`

## Local Run
1. `npm install`
2. `cp .env.example .env.local`
3. при готовності додати `EXPO_PUBLIC_SUPABASE_URL` і `EXPO_PUBLIC_SUPABASE_ANON_KEY`
4. `npm run dev`
5. `npm run typecheck`
6. `npm run validate`

## Current Limitation
- без Xcode і Android Studio я можу підготувати код і перевірки, але не можу локально зібрати реальні iOS/Android runtime flows на цьому Mac до встановлення нативного toolchain
