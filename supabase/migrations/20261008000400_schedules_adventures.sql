-- Phase 6: fixed-time schedules (calendar) and the daily Today's Adventure pick.
-- Neither moves XP, so both are plain own-row tables under RLS (no RPC needed).

-- ───────── schedules ─────────

create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  location text check (char_length(location) <= 80),
  quest_id uuid references public.quests (id) on delete set null,
  source text not null default 'manual' check (source in ('manual')),
  created_at timestamptz not null default now(),
  constraint schedules_ends_after_start check (ends_at is null or ends_at > starts_at)
);

create index schedules_user_starts_idx on public.schedules (user_id, starts_at);

alter table public.schedules enable row level security;

-- A linked quest must be the player's own.
create policy "schedules: read own" on public.schedules
  for select to authenticated using (user_id = (select auth.uid()));
create policy "schedules: insert own" on public.schedules
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and (quest_id is null or exists (
      select 1 from public.quests q where q.id = quest_id and q.user_id = (select auth.uid())
    ))
  );
create policy "schedules: update own" on public.schedules
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (quest_id is null or exists (
      select 1 from public.quests q where q.id = quest_id and q.user_id = (select auth.uid())
    ))
  );
create policy "schedules: delete own" on public.schedules
  for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.schedules from anon, authenticated;
grant select, delete on public.schedules to authenticated;
grant insert (title, starts_at, ends_at, all_day, location, quest_id) on public.schedules to authenticated;
grant update (title, starts_at, ends_at, all_day, location, quest_id) on public.schedules to authenticated;

-- ───────── adventures (one Today's Adventure per game day) ─────────

create table public.adventures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  game_date date not null,
  quest_ids uuid[] not null check (cardinality(quest_ids) between 1 and 6),
  briefing text check (char_length(briefing) <= 300),
  source text not null default 'auto' check (source in ('auto', 'custom')),
  started_at timestamptz not null default now(),
  constraint adventures_once_per_day unique (user_id, game_date)
);

alter table public.adventures enable row level security;

-- Every picked quest must be the player's own.
create function public.owns_all_quests(p_ids uuid[])
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select not exists (
    select 1 from unnest(p_ids) as picked(id)
    where not exists (
      select 1 from public.quests q where q.id = picked.id and q.user_id = (select auth.uid())
    )
  );
$$;

create policy "adventures: read own" on public.adventures
  for select to authenticated using (user_id = (select auth.uid()));
create policy "adventures: insert own" on public.adventures
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.owns_all_quests(quest_ids));
create policy "adventures: update own" on public.adventures
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.owns_all_quests(quest_ids));

revoke all on public.adventures from anon, authenticated;
grant select on public.adventures to authenticated;
grant insert (game_date, quest_ids, briefing, source, started_at) on public.adventures to authenticated;
-- game_date is included only because PostgREST upserts SET every posted column; the unique
-- (user_id, game_date) key still pins the row.
grant update (game_date, quest_ids, briefing, source, started_at) on public.adventures to authenticated;
