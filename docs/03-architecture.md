# Architecture

## Client
- `Expo + React Native + TypeScript`
- `Expo Router` для навігації
- `Zustand` для app state
- `TanStack Query` для server/query state
- `i18next + react-i18next` для локалізації

## Backend
- `Supabase Auth` для anonymous session
- `Postgres` для профілів, контенту, кімнат, результатів
- `Realtime Presence/Broadcast` для lobby і room sync
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
