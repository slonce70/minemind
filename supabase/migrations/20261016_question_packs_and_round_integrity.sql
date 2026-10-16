-- Question packs: one canonical difficulty vocabulary (easy / medium / hard) shared with rooms
-- and the app. Legacy hand-written launch packs (no slug) are kept for history but retired;
-- live content comes from supabase/seed.sql, generated from the validated content bank.
alter table public.question_packs
  add column if not exists slug text,
  add column if not exists is_active boolean not null default true;

update public.question_packs
set difficulty = 'easy'
where difficulty not in ('easy', 'medium', 'hard');

update public.question_packs
set is_active = false
where slug is null;

alter table public.question_packs
  drop constraint if exists question_packs_difficulty_check;

alter table public.question_packs
  add constraint question_packs_difficulty_check check (difficulty in ('easy', 'medium', 'hard'));

create unique index if not exists question_packs_slug_idx on public.question_packs (slug);

-- Stable content-bank id per question so the seed can update packs in place
-- (deleting rows would cascade into answer history).
alter table public.questions
  add column if not exists content_id text,
  add column if not exists is_active boolean not null default true;

create unique index if not exists questions_pack_content_idx on public.questions (pack_id, content_id);

-- Answers: one row per (round, player, question). The row is created when the player opens the
-- question (selected_option is null, opened_at starts the server timer) and is answered exactly once.
alter table public.answer_submissions
  alter column selected_option drop not null,
  add column if not exists opened_at timestamptz;

-- Answers must go through submit-answer, which measures time on the server.
drop policy if exists "participants can submit their own answers" on public.answer_submissions;
