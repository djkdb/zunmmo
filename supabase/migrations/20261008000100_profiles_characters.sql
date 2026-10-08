-- Phase 3: players, characters and stats.
-- Conventions (docs/ARCHITECTURE.md §5):
--   * every table has RLS; "own" = user_id = (select auth.uid())
--   * XP-bearing columns are never writable by clients — only SECURITY DEFINER RPCs
--   * levels are derived from total_xp in the app (src/lib/game), never stored

create type public.stat_type as enum ('int', 'foc', 'vit', 'soc', 'cre');

-- ───────── helpers ─────────

create function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ───────── profiles (1:1 with auth.users) ─────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  timezone text not null default 'Asia/Seoul',
  day_start_hour smallint not null default 4 check (day_start_hour between 0 and 12),
  daily_capacity_min smallint not null default 240 check (daily_capacity_min between 30 and 960),
  locale text not null default 'ko',
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, timezone, day_start_hour, daily_capacity_min, locale) on public.profiles to authenticated;

-- Every new auth user gets a profile. Display name defaults to the email local part.
create function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(nullif(split_part(coalesce(new.email, ''), '@', 1), ''), '모험가'), 40)
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────── characters ─────────

create table public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 16),
  -- design/CHARACTER_GUIDE.md §7, validated by Zod in the app; the DB only checks the shape.
  appearance jsonb not null check (jsonb_typeof(appearance) = 'object' and appearance ->> 'version' = '1'),
  -- Cache of sum(xp_logs.amount); written only by XP RPCs in the same transaction.
  total_xp bigint not null default 0 check (total_xp >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger characters_set_updated_at before update on public.characters
  for each row execute function public.set_updated_at();

alter table public.characters enable row level security;

create policy "characters: read own" on public.characters
  for select to authenticated using (user_id = (select auth.uid()));
create policy "characters: update own" on public.characters
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on public.characters from anon, authenticated;
grant select on public.characters to authenticated;
-- Clients may rename or restyle — never touch XP.
grant update (name, appearance) on public.characters to authenticated;

-- ───────── character_stats ─────────

create table public.character_stats (
  character_id uuid not null references public.characters (id) on delete cascade,
  stat public.stat_type not null,
  xp bigint not null default 0 check (xp >= 0),
  primary key (character_id, stat)
);

alter table public.character_stats enable row level security;

create policy "character_stats: read own" on public.character_stats
  for select to authenticated using (
    exists (
      select 1 from public.characters c
      where c.id = character_id and c.user_id = (select auth.uid())
    )
  );

revoke all on public.character_stats from anon, authenticated;
grant select on public.character_stats to authenticated;

-- ───────── RPC: create_character ─────────

create function public.create_character(p_name text, p_appearance jsonb)
returns public.characters
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_character public.characters;
begin
  if v_user is null then
    raise exception 'UNAUTHENTICATED' using errcode = '28000';
  end if;
  if exists (select 1 from public.characters where user_id = v_user) then
    raise exception 'CHARACTER_EXISTS' using errcode = '23505';
  end if;

  insert into public.characters (user_id, name, appearance)
  values (v_user, btrim(p_name), p_appearance)
  returning * into v_character;

  insert into public.character_stats (character_id, stat)
  select v_character.id, s from unnest(enum_range(null::public.stat_type)) as s;

  update public.profiles set onboarded_at = coalesce(onboarded_at, now()) where id = v_user;

  return v_character;
end;
$$;

revoke all on function public.create_character(text, jsonb) from public, anon;
grant execute on function public.create_character(text, jsonb) to authenticated;
