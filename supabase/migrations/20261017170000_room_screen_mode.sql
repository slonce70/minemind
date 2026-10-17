-- "Big screen" rooms: the host's device only shows the questions (a TV or projector in a class or
-- at a party) and everyone answers on their phones. The host is left out of readiness, the
-- standings and the results.
alter table public.rooms
  add column if not exists screen_mode boolean not null default false;
