-- Answer statistics per question (by content id, so all languages count together): how often it
-- is answered right and how long players take. scripts/suggest-difficulty.ts reads it to propose
-- difficulty changes. Room answers are counted by a trigger; solo rounds report through the
-- report-answers Edge Function. Nothing here identifies a player.
create table if not exists public.question_stats (
  content_id text primary key,
  attempts integer not null default 0,
  correct integer not null default 0,
  -- Answers with a measured time (misses are not timed).
  timed_answers integer not null default 0,
  answer_ms_total bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.question_stats enable row level security;
revoke all on public.question_stats from anon, authenticated;

-- entries: [{ "contentId": text, "correct": bool, "answerMs": int | null }]. Unknown questions are
-- ignored; times are clamped to one question's longest timer plus the +time hint.
create or replace function public.record_answer_stats(entries jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.question_stats as stats (content_id, attempts, correct, timed_answers, answer_ms_total, updated_at)
  select
    entry ->> 'contentId',
    count(*),
    count(*) filter (where (entry ->> 'correct')::boolean),
    count(entry -> 'answerMs') filter (where jsonb_typeof(entry -> 'answerMs') = 'number'),
    coalesce(sum(least(greatest((entry ->> 'answerMs')::bigint, 0), 30000)) filter (where jsonb_typeof(entry -> 'answerMs') = 'number'), 0),
    now()
  from jsonb_array_elements(entries) as entry
  where jsonb_typeof(entry -> 'correct') = 'boolean'
    and exists (select 1 from public.questions question where question.content_id = entry ->> 'contentId')
  group by entry ->> 'contentId'
  on conflict (content_id) do update set
    attempts = stats.attempts + excluded.attempts,
    correct = stats.correct + excluded.correct,
    timed_answers = stats.timed_answers + excluded.timed_answers,
    answer_ms_total = stats.answer_ms_total + excluded.answer_ms_total,
    updated_at = now();
$$;

revoke all on function public.record_answer_stats(jsonb) from public, anon, authenticated;
grant execute on function public.record_answer_stats(jsonb) to service_role;

-- Live room answers: counted as they are submitted.
create or replace function public.count_room_answer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  question record;
  timer_ms integer;
begin
  select q.content_id, q.correct_option into question from public.questions q where q.id = new.question_id;

  if question.content_id is null then
    return new;
  end if;

  select case r.difficulty when 'easy' then 20000 when 'hard' then 15000 else 18000 end
    into timer_ms
    from public.round_sessions r
    where r.id = new.round_id;

  perform public.record_answer_stats(jsonb_build_array(jsonb_build_object(
    'contentId', question.content_id,
    'correct', coalesce(new.selected_option = question.correct_option, false),
    'answerMs', case when new.selected_option >= 0 then coalesce(timer_ms, 18000) - coalesce(new.time_left_ms, 0) end
  )));

  return new;
end;
$$;

drop trigger if exists count_room_answer on public.answer_submissions;
create trigger count_room_answer
  after insert on public.answer_submissions
  for each row execute function public.count_room_answer();
