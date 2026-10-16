-- Room limits: player cap, per-player rate limits and closing abandoned rooms.

-- 1. At most 8 players per room, enforced in the database so parallel joins cannot overshoot.
create or replace function public.enforce_room_player_limit()
returns trigger
language plpgsql
as $$
begin
  -- Re-joining (upsert of an existing member) never counts as a new player.
  if exists (
    select 1 from public.room_participants where room_id = new.room_id and player_id = new.player_id
  ) then
    return new;
  end if;

  perform 1 from public.rooms where id = new.room_id for update;

  if (select count(*) from public.room_participants where room_id = new.room_id) >= 8 then
    raise exception 'room_full' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists room_participants_player_limit on public.room_participants;
create trigger room_participants_player_limit
  before insert on public.room_participants
  for each row execute function public.enforce_room_player_limit();

-- 2. Rate limits for room creation and joining (per player, sliding window).
create table if not exists public.rate_limit_hits (
  player_id uuid not null references public.guest_profiles (id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_hits_lookup_idx
  on public.rate_limit_hits (player_id, action, created_at);

alter table public.rate_limit_hits enable row level security;
revoke all on public.rate_limit_hits from anon, authenticated;

-- Returns false when the player already used `max_hits` within `window_size`; otherwise records
-- the hit. Serialized per player and action, so bursts of parallel requests are counted exactly.
create or replace function public.consume_rate_limit(
  target_player_id uuid,
  target_action text,
  max_hits integer,
  window_size interval
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtext(target_player_id::text || ':' || target_action));

  if (
    select count(*)
    from public.rate_limit_hits
    where player_id = target_player_id
      and action = target_action
      and created_at > now() - window_size
  ) >= max_hits then
    return false;
  end if;

  insert into public.rate_limit_hits (player_id, action) values (target_player_id, target_action);

  return true;
end;
$$;

revoke all on function public.consume_rate_limit(uuid, text, integer, interval) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(uuid, text, integer, interval) to service_role;

-- 3. Abandoned rooms: no activity for 2 hours. They are closed (status finished), never deleted,
--    so finished rounds and results stay. Old rate-limit hits are pruned at the same time.
create or replace function public.close_abandoned_rooms()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  closed_count integer;
begin
  update public.rooms
  set status = 'finished', current_round_id = null
  where status <> 'finished'
    and last_activity_at < now() - interval '2 hours';

  get diagnostics closed_count = row_count;

  delete from public.rate_limit_hits where created_at < now() - interval '1 day';

  return closed_count;
end;
$$;

revoke all on function public.close_abandoned_rooms() from public, anon, authenticated;
grant execute on function public.close_abandoned_rooms() to service_role;

-- Run it every 15 minutes where pg_cron is available (hosted Supabase, local stack). Edge
-- Functions also call it when a room is created, so it runs even without cron.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('close-abandoned-rooms', '*/15 * * * *', 'select public.close_abandoned_rooms()');
  end if;
end;
$$;
