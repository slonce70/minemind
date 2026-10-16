# Architecture

## Client
- `Expo + React Native + TypeScript`
- `Expo Router` для навігації
- `Zustand` для app state
- `TanStack Query` для server/query state
- `i18next + react-i18next` для локалізації

## UI, звук і доступність
- дизайн-токени в одному місці: `src/theme/tokens.ts` (кольори, шрифти `fonts`, відступи, радіуси, `motion`, ширина колонки для планшета)
- пікселі в коді: `src/features/ui/pixel-art.ts` (іконки, маскот Кубик), `src/features/profile/avatar-presets.ts` (аватари); рендер через `react-native-svg`
- анімації на `react-native-reanimated`; усі шанують системне «зменшення руху» (`useReducedMotion`)
- `src/features/feel/feedback.ts`: звукові ефекти, музика й вібрація, кожне за своїм перемикачем у `settings` стора
- озвучення питання: `src/features/feel/read-aloud.ts` (`expo-speech`)
- правила ніків спільні для застосунку й Edge Functions: `supabase/functions/_shared/nickname-rules.ts`, SQL-дзеркало в міграції `20261017130000_nickname_rules.sql`

## Backend
- `Supabase Auth` для anonymous session
- `Postgres` для профілів, контенту, кімнат, результатів
- `Realtime`: postgres_changes по `rooms`, Presence і Broadcast у приватному каналі `room:<id>` для лобі й раунду; опитування лише як запасний шлях
- спільний серверний таймлайн раунду, переклади питань у БД (див. `04-data-model.md`)
- помилки Edge Functions як `{ code, error }`, переклад коду в застосунку; звіти про помилки в Sentry за `EXPO_PUBLIC_SENTRY_DSN` (без DSN вимкнено)
- `Edge Functions` для server-authoritative actions

## Offline-First Foundation
- якщо `EXPO_PUBLIC_SUPABASE_URL` і `EXPO_PUBLIC_SUPABASE_ANON_KEY` не задані, app працює в local mock mode
- це дозволяє тестувати UX і content loop до підняття backend
- локальний canonical content source живе в `content/minecraft/minecraft-question-bank.v1.json`
- derived pack summaries будуються через `scripts/export-question-packs.ts`
- локальні `ActiveRoom.settings` уже несуть `difficulty`, `contentPackVersion`, `questionCount` і `topicMode`

## Boundaries
- клієнт не є джерелом істини для фінального score
- content у v1 curated і редагується командою, а не користувачами
- room lifecycle визначається backend-сесією, а не локальною логікою host-only
- future live rooms мають нести `difficulty`, `contentPackVersion` і server-chosen question IDs
