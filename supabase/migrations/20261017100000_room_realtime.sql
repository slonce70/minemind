-- Realtime for rooms: lobby and round state is pushed to members instead of polled.
--
-- 1. Membership check that does not recurse through RLS. The old policies on rooms and
--    room_participants call each other (rooms -> room_participants -> is_room_participant ->
--    rooms), which only worked because clients never read these tables directly.
create or replace function public.is_room_member(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.rooms where id = target_room_id and host_id = auth.uid()
  ) or exists(
    select 1 from public.room_participants where room_id = target_room_id and player_id = auth.uid()
  );
$$;

revoke all on function public.is_room_member(uuid) from public, anon;
grant execute on function public.is_room_member(uuid) to authenticated;

drop policy if exists "participants can read joined rooms" on public.rooms;
create policy "participants can read joined rooms"
  on public.rooms for select
  using (public.is_room_member(id));

drop policy if exists "participants can read room membership" on public.room_participants;
create policy "participants can read room membership"
  on public.room_participants for select
  using (public.is_room_member(room_id));

-- Rooms and memberships are created only by Edge Functions (room limits, rate limits).
drop policy if exists "authenticated users can create rooms" on public.rooms;
drop policy if exists "players can join themselves" on public.room_participants;

-- 2. Activity timestamp: any change to the room or its members touches the room row, so one
--    postgres_changes subscription on rooms covers joins, leaves and ready toggles. The same
--    column drives the clean-up of abandoned rooms.
alter table public.rooms
  add column if not exists last_activity_at timestamptz not null default now();

create or replace function public.touch_room_activity()
returns trigger
language plpgsql
as $$
begin
  new.last_activity_at := now();
  return new;
end;
$$;

drop trigger if exists rooms_touch_activity on public.rooms;
create trigger rooms_touch_activity
  before update on public.rooms
  for each row execute function public.touch_room_activity();

create or replace function public.touch_room_from_participants()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.rooms
  set last_activity_at = now()
  where id = coalesce(new.room_id, old.room_id);

  return null;
end;
$$;

drop trigger if exists room_participants_touch_room on public.room_participants;
create trigger room_participants_touch_room
  after insert or update or delete on public.room_participants
  for each row execute function public.touch_room_from_participants();

-- 3. Publish room changes (RLS above limits each subscriber to their own rooms).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rooms'
    ) then
    alter publication supabase_realtime add table public.rooms;
  end if;
end;
$$;

-- 4. Private channel `room:<room id>`: only members may listen or share presence. Broadcasts
--    (answer progress) are sent by Edge Functions with the service role, never by clients.
do $$
begin
  if to_regclass('realtime.messages') is not null then
    execute 'drop policy if exists "room members read the room channel" on realtime.messages';
    execute $policy$
      create policy "room members read the room channel"
        on realtime.messages for select to authenticated
        using (
          split_part(realtime.topic(), ':', 1) = 'room'
          and public.is_room_member(nullif(split_part(realtime.topic(), ':', 2), '')::uuid)
        )
    $policy$;

    execute 'drop policy if exists "room members share presence" on realtime.messages';
    execute $policy$
      create policy "room members share presence"
        on realtime.messages for insert to authenticated
        with check (
          realtime.messages.extension = 'presence'
          and split_part(realtime.topic(), ':', 1) = 'room'
          and public.is_room_member(nullif(split_part(realtime.topic(), ':', 2), '')::uuid)
        )
    $policy$;
  end if;
end;
$$;
