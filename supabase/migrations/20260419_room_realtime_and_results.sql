alter table public.round_sessions
  add column if not exists finalized_at timestamptz,
  add column if not exists result_snapshot jsonb;

alter table public.rooms
  drop constraint if exists rooms_status_check;

alter table public.rooms
  alter column status set default 'lobby';

alter table public.rooms
  add constraint rooms_status_check
  check (status in ('lobby', 'active', 'waiting', 'finalizing', 'finished'));
