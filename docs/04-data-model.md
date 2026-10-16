# Data Model

## Core Entities
- `guest_profiles`
  - `id`
  - `nickname`
  - `avatar_id`
  - `locale`
- `quiz_categories`
  - `id`
  - `slug`
  - `title`
  - `status`
- `question_packs`
  - `id`
  - `category_id`
  - `slug` (`minecraft-<difficulty>`)
  - `locale` (null: the pack is language-neutral; the first release's per-locale packs are inactive)
  - `age_band`
  - `difficulty`
  - `is_active`
- `questions` (one row per fact)
  - `id`
  - `pack_id`
  - `content_id` (id in the content bank)
  - `prompt`, `option_a..d`, `explanation` (English fallback)
  - `correct_option` (canonical option order; answers are checked by position)
  - `sort_order`
  - `is_active`
- `question_translations`
  - `question_id`
  - `locale` (`uk`, `en`, `ru`)
  - `prompt`, `option_a..d`, `explanation`
- `rooms`
  - `id`
  - `room_code`
  - `host_id`
  - `status`
  - `current_round_id`
  - `last_activity_at` (touched by any change to the room or its members; idle 2 h → closed)
- `room_participants`
  - `room_id`
  - `player_id`
  - `ready_state`
- `round_sessions`
  - `id`
  - `room_id`
  - `question_ids`
  - `started_at`
  - `ends_at`
- `rate_limit_hits`
  - `player_id`
  - `action` (`create-room`, `join-room`)
  - `created_at`
- `answer_submissions`
  - `round_id`
  - `player_id`
  - `question_id`
  - `selected_option`
  - `time_left_ms`
- `match_results`
  - `round_id`
  - `player_id`
  - `score`
  - `rank`
  - `correct_count`
- `leaderboard_entries`
  - `scope`
  - `player_id`
  - `score`

## Live Round Timeline
`round_sessions.started_at` fixes the timeline for everyone (`questionWindow` in `supabase/functions/_shared/game-rules.ts`): a 5 s countdown, then question `i` is open for the difficulty timer and followed by 10 s of answer and standings. `get-room-round` hands out a question 2 s before it opens, in the player's language, plus the standings over closed questions; `submit-answer` times answers against the question's close time on the server clock. `ends_at` is the last close plus 3 s of network grace.

## Realtime
`rooms` is in the `supabase_realtime` publication; RLS lets only members read their rooms. The private channel `room:<room id>` (RLS on `realtime.messages`) carries Presence (who is online) and the server's `answer-progress` broadcasts (who answered, never what).

## Server Authority
- room creation
- join validation
- round start
- score finalize
- leaderboard writes
