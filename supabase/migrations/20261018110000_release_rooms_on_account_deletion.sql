-- Deleting an account must not break rooms for the other players.
-- 1. A room outlives its host's profile: finished rounds and other players' results stay.
-- 2. delete-account calls release_player_rooms first: the host role goes to the earliest-joined
--    remaining participant; a room nobody is left in is closed with a reason the app can show.

alter table public.rooms alter column host_id drop not null;
alter table public.rooms drop constraint if exists rooms_host_id_fkey;
alter table public.rooms
  add constraint rooms_host_id_fkey
  foreign key (host_id) references public.guest_profiles (id) on delete set null;

alter table public.rooms
  add column if not exists closed_reason text check (closed_reason in ('host-deleted', 'inactive'));

create or replace function public.release_player_rooms(target_player_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  open_room record;
  next_host uuid;
  released integer := 0;
begin
  for open_room in
    select room.id, room.host_id
    from public.rooms room
    where room.status <> 'finished'
      and (
        room.host_id = target_player_id
        or exists (
          select 1 from public.room_participants participant
          where participant.room_id = room.id and participant.player_id = target_player_id
        )
      )
    for update of room
  loop
    delete from public.room_participants
    where room_id = open_room.id and player_id = target_player_id;

    select participant.player_id into next_host
    from public.room_participants participant
    where participant.room_id = open_room.id
    order by participant.joined_at, participant.player_id
    limit 1;

    if next_host is null then
      update public.rooms
      set status = 'finished',
          current_round_id = null,
          closed_reason = case when open_room.host_id = target_player_id then 'host-deleted' else closed_reason end
      where id = open_room.id;
    elsif open_room.host_id = target_player_id then
      -- The big screen was the old host's device, so the new host plays like everyone else.
      update public.rooms
      set host_id = next_host, screen_mode = false, last_activity_at = now()
      where id = open_room.id;
    else
      -- Touch the room so the others' realtime subscription re-reads the roster.
      update public.rooms set last_activity_at = now() where id = open_room.id;
    end if;

    released := released + 1;
  end loop;

  return released;
end;
$$;

revoke all on function public.release_player_rooms(uuid) from public, anon, authenticated;
grant execute on function public.release_player_rooms(uuid) to service_role;

-- Idle rooms closed by the cron job say so too.
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
  set status = 'finished', current_round_id = null, closed_reason = 'inactive'
  where status <> 'finished'
    and last_activity_at < now() - interval '2 hours';

  get diagnostics closed_count = row_count;

  delete from public.rate_limit_hits where created_at < now() - interval '1 day';

  return closed_count;
end;
$$;

revoke all on function public.close_abandoned_rooms() from public, anon, authenticated;
grant execute on function public.close_abandoned_rooms() to service_role;
