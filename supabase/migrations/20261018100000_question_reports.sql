-- Players report a question they think is wrong by picking a reason (no free text: the players are
-- kids). Written only through the report-question Edge Function (service role, rate limited); the
-- content team reads it with scripts/list-question-reports.ts. Deleted with the account.
create table if not exists public.question_reports (
  id uuid primary key default gen_random_uuid(),
  content_id text not null,
  reason text not null check (reason in ('wrong-answer', 'outdated', 'typo', 'unclear', 'other')),
  locale text not null check (locale in ('uk', 'en', 'ru')),
  player_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists question_reports_content_idx on public.question_reports (content_id, created_at desc);
create index if not exists question_reports_player_idx on public.question_reports (player_id);

alter table public.question_reports enable row level security;
revoke all on public.question_reports from anon, authenticated;
