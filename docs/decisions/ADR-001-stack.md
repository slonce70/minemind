# ADR-001: Stack Choice

## Decision
Використовуємо `Expo + React Native + Supabase`.

## Why
- один mobile codebase
- швидкий prototyping cycle
- безкоштовний early-stage path
- простий realtime path для private rooms

## Rejected
- `Firebase` як primary v1 backend
  - добра опція, але `Cloud Functions` швидко заводять у платний режим
- `Flutter`
  - теж можливий, але менше користі для поточного Codex workflow
- `Unity`
  - занадто важкий для quiz-first app
