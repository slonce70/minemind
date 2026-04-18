create extension if not exists "pgcrypto";

create or replace function public.nickname_is_allowed(candidate text)
returns boolean
language plpgsql
immutable
as $$
declare
  normalized text := lower(trim(regexp_replace(candidate, '\s+', ' ', 'g')));
begin
  if candidate is null then
    return false;
  end if;

  if char_length(normalized) < 2 or char_length(normalized) > 16 then
    return false;
  end if;

  if normalized !~ '^[0-9A-Za-zА-Яа-яЁёЇїІіЄєҐґ_ -]+$' then
    return false;
  end if;

  if normalized like '%admin%'
    or normalized like '%owner%'
    or normalized like '%mod%'
    or normalized like '%fuck%'
    or normalized like '%shit%'
    or normalized like '%sex%'
    or normalized like '%сука%'
    or normalized like '%хуй%' then
    return false;
  end if;

  return true;
end;
$$;

create table if not exists public.guest_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null check (public.nickname_is_allowed(nickname)),
  avatar_id text not null,
  locale text not null check (locale in ('uk', 'en', 'ru')),
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.question_packs (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.quiz_categories (id) on delete cascade,
  locale text not null check (locale in ('uk', 'en', 'ru')),
  age_band text not null,
  difficulty text not null,
  title text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references public.question_packs (id) on delete cascade,
  prompt text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option smallint not null check (correct_option between 0 and 3),
  explanation text not null,
  sort_order integer not null default 0
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  host_id uuid not null references public.guest_profiles (id) on delete cascade,
  status text not null default 'waiting' check (status in ('waiting', 'active', 'completed')),
  current_round_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.room_participants (
  room_id uuid not null references public.rooms (id) on delete cascade,
  player_id uuid not null references public.guest_profiles (id) on delete cascade,
  ready_state boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (room_id, player_id)
);

create table if not exists public.round_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms (id) on delete cascade,
  question_ids uuid[] not null,
  started_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.rooms
  add constraint rooms_current_round_fk
  foreign key (current_round_id) references public.round_sessions (id) on delete set null;

create table if not exists public.answer_submissions (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.round_sessions (id) on delete cascade,
  player_id uuid not null references public.guest_profiles (id) on delete cascade,
  question_id uuid not null,
  selected_option smallint not null check (selected_option between -1 and 3),
  time_left_ms integer not null default 0,
  submitted_at timestamptz not null default now()
);

create unique index if not exists answer_submissions_round_player_question_idx
  on public.answer_submissions (round_id, player_id, question_id);

create table if not exists public.match_results (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.round_sessions (id) on delete cascade,
  player_id uuid not null references public.guest_profiles (id) on delete cascade,
  score integer not null default 0,
  rank integer,
  correct_count integer not null default 0,
  best_streak integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists match_results_round_player_idx
  on public.match_results (round_id, player_id);

create table if not exists public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('daily', 'weekly', 'all_time')),
  player_id uuid not null references public.guest_profiles (id) on delete cascade,
  score integer not null default 0,
  updated_at timestamptz not null default now()
);

create unique index if not exists leaderboard_scope_player_idx
  on public.leaderboard_entries (scope, player_id);

create or replace function public.generate_room_code()
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  candidate text := '';
  code_exists boolean := true;
  idx integer;
begin
  while code_exists loop
    candidate := '';

    for idx in 1..6 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;

    select exists(select 1 from public.rooms where room_code = candidate) into code_exists;
  end loop;

  return candidate;
end;
$$;

create or replace function public.is_room_participant(target_room_id uuid, target_user_id uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.rooms room
    left join public.room_participants participant
      on participant.room_id = room.id
    where room.id = target_room_id
      and (room.host_id = target_user_id or participant.player_id = target_user_id)
  );
$$;

create or replace function public.touch_leaderboard_entry(
  target_scope text,
  target_player_id uuid,
  additional_score integer
)
returns void
language plpgsql
as $$
begin
  insert into public.leaderboard_entries (scope, player_id, score, updated_at)
  values (target_scope, target_player_id, greatest(additional_score, 0), now())
  on conflict (scope, player_id)
  do update
    set score = public.leaderboard_entries.score + greatest(additional_score, 0),
        updated_at = now();
end;
$$;

alter table public.guest_profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_participants enable row level security;
alter table public.round_sessions enable row level security;
alter table public.answer_submissions enable row level security;
alter table public.match_results enable row level security;
alter table public.leaderboard_entries enable row level security;

create policy "profiles are readable by owner"
  on public.guest_profiles for select
  using (auth.uid() = id);

create policy "profiles are writable by owner"
  on public.guest_profiles for insert
  with check (auth.uid() = id);

create policy "profiles are updatable by owner"
  on public.guest_profiles for update
  using (auth.uid() = id);

create policy "participants can read joined rooms"
  on public.rooms for select
  using (
    host_id = auth.uid()
    or exists (
      select 1 from public.room_participants
      where room_participants.room_id = rooms.id
        and room_participants.player_id = auth.uid()
    )
  );

create policy "authenticated users can create rooms"
  on public.rooms for insert
  with check (host_id = auth.uid());

create policy "participants can read room membership"
  on public.room_participants for select
  using (
    player_id = auth.uid()
    or public.is_room_participant(room_id, auth.uid())
  );

create policy "players can join themselves"
  on public.room_participants for insert
  with check (player_id = auth.uid());

create policy "participants can read their own answers"
  on public.answer_submissions for select
  using (
    player_id = auth.uid()
    or exists (
      select 1
      from public.round_sessions round_session
      where round_session.id = answer_submissions.round_id
        and public.is_room_participant(round_session.room_id, auth.uid())
    )
  );

create policy "participants can submit their own answers"
  on public.answer_submissions for insert
  with check (
    player_id = auth.uid()
    and exists (
      select 1
      from public.round_sessions round_session
      where round_session.id = answer_submissions.round_id
        and public.is_room_participant(round_session.room_id, auth.uid())
    )
  );

create policy "players can read their own match results"
  on public.match_results for select
  using (
    player_id = auth.uid()
    or exists (
      select 1
      from public.round_sessions round_session
      where round_session.id = match_results.round_id
        and public.is_room_participant(round_session.room_id, auth.uid())
    )
  );

create policy "leaderboard is readable by authenticated users"
  on public.leaderboard_entries for select
  using (auth.role() = 'authenticated');

grant execute on function public.generate_room_code() to authenticated;
grant execute on function public.is_room_participant(uuid, uuid) to authenticated;
grant execute on function public.nickname_is_allowed(text) to authenticated;
grant execute on function public.touch_leaderboard_entry(text, uuid, integer) to authenticated;
