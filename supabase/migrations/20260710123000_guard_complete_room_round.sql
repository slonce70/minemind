-- Idempotency guard: complete_room_round reset rooms.current_round_id and
-- room_participants unconditionally by target_room_id. A lagging client (or a
-- retry) finalizing a *previous* round after a new one had started would tear
-- down the new active round for everyone. Guard the room/participant resets so
-- they only apply while the target round is still the room's current round.
-- The match_results insert stays idempotent via `on conflict do nothing`.

create or replace function public.complete_room_round(
  target_round_id uuid,
  target_room_id uuid,
  rankings jsonb,
  ranking_snapshot jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ranking_entry jsonb;
  inserted_player_id uuid;
  inserted_score integer;
begin
  for ranking_entry in select * from jsonb_array_elements(rankings) loop
    inserted_player_id := (ranking_entry->>'player_id')::uuid;
    inserted_score := greatest(coalesce((ranking_entry->>'score')::integer, 0), 0);

    insert into public.match_results (
      best_streak,
      correct_count,
      player_id,
      rank,
      round_id,
      score
    )
    values (
      coalesce((ranking_entry->>'best_streak')::integer, 0),
      coalesce((ranking_entry->>'correct_count')::integer, 0),
      inserted_player_id,
      coalesce((ranking_entry->>'rank')::integer, 0),
      target_round_id,
      inserted_score
    )
    on conflict (round_id, player_id) do nothing;

    if found then
      perform public.touch_leaderboard_entry(
        'all_time',
        inserted_player_id,
        inserted_score
      );
    end if;
  end loop;

  update public.round_sessions
  set
    ends_at = coalesce(ends_at, now()),
    finalized_at = coalesce(finalized_at, now()),
    result_snapshot = ranking_snapshot
  where id = target_round_id;

  -- Only reset the room if this round is still the active one. A stale finalize
  -- for a superseded round becomes a no-op here.
  update public.rooms
  set
    current_round_id = null,
    status = 'waiting'
  where id = target_room_id
    and current_round_id = target_round_id;

  update public.room_participants
  set ready_state = false
  where room_id = target_room_id
    and exists (
      select 1
      from public.rooms
      where rooms.id = target_room_id
        and rooms.current_round_id is null
    );
end;
$$;

revoke all on function public.complete_room_round(uuid, uuid, jsonb, jsonb) from public;
revoke all on function public.complete_room_round(uuid, uuid, jsonb, jsonb) from anon;
revoke all on function public.complete_room_round(uuid, uuid, jsonb, jsonb) from authenticated;
grant execute on function public.complete_room_round(uuid, uuid, jsonb, jsonb) to service_role;
