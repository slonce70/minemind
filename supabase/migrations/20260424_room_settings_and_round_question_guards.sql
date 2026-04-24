alter table public.answer_submissions
  add constraint answer_submissions_question_fk
  foreign key (question_id) references public.questions (id) on delete cascade;

alter table public.rooms
  add column if not exists content_pack_version text not null default 'minecraft-v1',
  add column if not exists difficulty text not null default 'medium',
  add column if not exists question_count integer not null default 8,
  add column if not exists topic_mode text not null default 'mixed';

alter table public.rooms
  drop constraint if exists rooms_difficulty_check,
  drop constraint if exists rooms_question_count_check,
  drop constraint if exists rooms_topic_mode_check;

alter table public.rooms
  add constraint rooms_difficulty_check check (difficulty in ('easy', 'medium', 'hard')),
  add constraint rooms_question_count_check check (question_count = 8),
  add constraint rooms_topic_mode_check check (topic_mode = 'mixed');

alter table public.round_sessions
  add column if not exists content_pack_version text not null default 'minecraft-v1',
  add column if not exists difficulty text not null default 'medium',
  add column if not exists question_count integer not null default 8,
  add column if not exists topic_mode text not null default 'mixed';

alter table public.round_sessions
  drop constraint if exists round_sessions_difficulty_check,
  drop constraint if exists round_sessions_question_count_check,
  drop constraint if exists round_sessions_topic_mode_check;

alter table public.round_sessions
  add constraint round_sessions_difficulty_check check (difficulty in ('easy', 'medium', 'hard')),
  add constraint round_sessions_question_count_check check (question_count = 8),
  add constraint round_sessions_topic_mode_check check (topic_mode = 'mixed');
