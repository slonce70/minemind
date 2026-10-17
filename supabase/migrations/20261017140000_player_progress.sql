-- Cloud copy of a player's progress (XP, streak, achievements, cards). The app is offline-first:
-- it merges this copy with the one on the device and writes the result back. Writes are
-- compare-and-swap on updated_at, so two devices never overwrite each other's progress.
create table if not exists public.player_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  xp integer not null default 0 check (xp >= 0),
  updated_at timestamptz not null default now(),
  constraint player_progress_size check (pg_column_size(progress) <= 65536),
  constraint player_progress_is_object check (jsonb_typeof(progress) = 'object')
);

alter table public.player_progress enable row level security;

revoke all on public.player_progress from anon;
grant select, insert, update on public.player_progress to authenticated;

drop policy if exists "players read their own progress" on public.player_progress;
create policy "players read their own progress"
  on public.player_progress for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "players create their own progress" on public.player_progress;
create policy "players create their own progress"
  on public.player_progress for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "players update their own progress" on public.player_progress;
create policy "players update their own progress"
  on public.player_progress for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Progress only grows: the bigger XP wins even if a stale device writes, and every write gets a
-- fresh version stamp for the next compare-and-swap.
create or replace function public.guard_player_progress()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.xp < old.xp then
    raise exception 'progress cannot go backwards' using errcode = 'check_violation';
  end if;

  new.updated_at := clock_timestamp();
  return new;
end;
$$;

drop trigger if exists guard_player_progress on public.player_progress;
create trigger guard_player_progress
  before insert or update on public.player_progress
  for each row execute function public.guard_player_progress();
