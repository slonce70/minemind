# Implementation Roadmap

## Wave 1 - Foundation
- Expo app
- theme
- i18n
- guest onboarding
- local mock solo quiz
- docs package
- Supabase schema scaffold
- status: `completed`

### Gate
- app збирає перший UX loop
- typecheck зелений
- docs і schema закомічені

## Wave 2 - Backend Connection
- anonymous auth
- profile upsert
- real content fetch
- Supabase health checks
- status: `code-complete, pending hosted credentials`

### Gate
- local mock fallback не ламається
- auth і data read/write працюють у hosted project

## Wave 3 - Private Rooms
- create room
- join by code
- ready state
- synchronized round start
- final podium
- status: `code-complete with live integration path + demo fallback`

### Gate
- 2-4 користувачі проходять матч з однаковим набором питань

## Wave 4 - Harden
- reconnect
- anti-cheat checks
- profanity hardening
- localization QA
- release copy
- status: `baseline complete, native/device QA still pending`

### Gate
- немає критичних blockers перед internal testing
