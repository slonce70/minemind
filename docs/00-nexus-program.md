# MineMind NEXUS-Full Program

## Режим
- `Activate NEXUS-Full mode for MineMind.`
- Використовуємо Codex NEXUS playbook.
- Порядок роботи: `planner -> phased plan with quality gates -> orchestrate only active multi-owner waves`.

## Поточний статус
- `current_mode`: `NEXUS-Full`
- `current_phase`: `Phase 5 - Internal release preparation`
- `active_wave`: `live integration path + validation + release-prep docs`
- `next_quality_gate`: native smoke checks after local toolchain install and hosted Supabase credentials

## Фази
### Phase 0 - Discovery
- Підтвердити позиціонування `Minecraft-first social quiz`.
- Зафіксувати безпечні межі для аудиторії `8-12`.

### Phase 1 - Strategy and Architecture
- Обрати стек `Expo + Supabase`.
- Визначити модель identity, content, scoring, room lifecycle.

### Phase 2 - Foundation
- Підняти Expo app.
- Додати theme, i18n, guest profile, solo gameplay.
- Додати Supabase migrations і function stubs.

### Phase 3 - Build
- Реалізувати private rooms: create, join, lobby, sync, final podium.

### Phase 4 - Harden
- Перевірити reconnect flow, anti-cheat rules, profanity filtering, store compliance.

### Phase 5 - Launch Prep
- Internal testing, TestFlight / Play testing, metadata, privacy docs.

## Already Completed
- Expo app foundation
- guest onboarding
- solo gameplay
- automated tests
- demo room flow
- live Supabase integration path for profile, solo start, room create/join/start/finalize
- CI-friendly validation command and workflow

## Quality Gates
- Gate A: app запускається локально з mock flow без backend.
- Gate B: anonymous auth і schema готові для Supabase.
- Gate C: solo round стабільний і typecheck зелений.
- Gate D: private rooms мають синхронний question set і прогнозований reconnect.
- Gate E: repo is internal-release-ready, blocked only by external credentials/tooling

## Active-Wave Rule
- Один активний writer на один file set.
- Нові owner roles підключаємо лише коли є реальна паралельність:
  - `mobile`
  - `backend`
  - `tester`
  - `reviewer`
- Якщо паралельність зникає, повертаємось до direct execution.
