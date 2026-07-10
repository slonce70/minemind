-- Security hardening: the initial schema enabled RLS on gameplay tables but
-- left quiz_categories, question_packs, and questions completely open. Postgres
-- grants anon/authenticated full CRUD on public tables by default, so with the
-- public anon key (shipped in the app) anyone could read correct_option /
-- explanation for every question, or rewrite/delete the bank. All content is
-- served exclusively through Edge Functions using the service_role key, which
-- bypasses RLS, so we can deny direct client access entirely.

alter table public.quiz_categories enable row level security;
alter table public.question_packs enable row level security;
alter table public.questions enable row level security;

-- No SELECT/INSERT/UPDATE/DELETE policies are defined for these tables, so with
-- RLS enabled anon/authenticated have no access. Revoke the default table
-- privileges as defense in depth (RLS + grants both closed).
revoke all on public.quiz_categories from anon, authenticated;
revoke all on public.question_packs from anon, authenticated;
revoke all on public.questions from anon, authenticated;

-- Answer submissions were readable by any room participant, letting players see
-- each other's selected options mid-round. Scoring runs server-side via the
-- service_role, so clients only ever need to read their own submissions.
drop policy if exists "participants can read their own answers" on public.answer_submissions;

create policy "players can read only their own answers"
  on public.answer_submissions for select
  using (player_id = auth.uid());
