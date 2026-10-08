-- Phase 4: Main Questlines (goals) and quests.
-- XP is a snapshot of lib/game questXp(type, difficulty) computed by the server action;
-- the DB only bounds it (see docs/ARCHITECTURE.md §5.3 known trade-off).
-- Deadlines are game dates (the player's local calendar day), not timestamps.

create type public.quest_type as enum ('main', 'daily', 'side', 'boss', 'hidden');
-- 'expired' is derived at read time from the deadline (lib/game effectiveStatus); kept for future use.
create type public.quest_status as enum ('active', 'completed', 'expired', 'archived');
create type public.goal_status as enum ('active', 'cleared', 'archived');
create type public.quest_source as enum ('manual', 'template', 'system');

-- ───────── goals (UI: MAIN QUEST / Main Questline) ─────────

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  description text check (char_length(description) <= 1000),
  target_date date,
  status public.goal_status not null default 'active',
  cleared_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index goals_user_status_idx on public.goals (user_id, status);
create trigger goals_set_updated_at before update on public.goals
  for each row execute function public.set_updated_at();

alter table public.goals enable row level security;

create policy "goals: read own" on public.goals
  for select to authenticated using (user_id = (select auth.uid()));
create policy "goals: insert own" on public.goals
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "goals: update own" on public.goals
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on public.goals from anon, authenticated;
grant select on public.goals to authenticated;
grant insert (title, description, target_date) on public.goals to authenticated;
-- status 'cleared' is set only by the clear_goal RPC (Phase 5); players can archive/unarchive.
grant update (title, description, target_date) on public.goals to authenticated;

-- ───────── quests ─────────

create table public.quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id uuid references public.goals (id) on delete set null,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  description text check (char_length(description) <= 1000),
  type public.quest_type not null,
  difficulty smallint not null check (difficulty between 1 and 5),
  xp integer not null check (xp between 0 and 1000),
  primary_stat public.stat_type not null,
  status public.quest_status not null default 'active',
  deadline date,
  scheduled_for date,
  estimated_minutes smallint check (estimated_minutes between 5 and 1440),
  repeat_rule jsonb check (repeat_rule is null or jsonb_typeof(repeat_rule) = 'object'),
  sort_order integer not null default 0,
  source public.quest_source not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint quests_boss_needs_deadline check (type <> 'boss' or deadline is not null),
  constraint quests_daily_needs_repeat check (type <> 'daily' or repeat_rule is not null),
  constraint quests_main_needs_goal check (type <> 'main' or goal_id is not null)
);

create index quests_user_status_type_idx on public.quests (user_id, status, type);
create index quests_user_deadline_idx on public.quests (user_id, deadline) where deadline is not null;
create index quests_goal_idx on public.quests (goal_id) where goal_id is not null;
create trigger quests_set_updated_at before update on public.quests
  for each row execute function public.set_updated_at();

-- A quest may only join a questline its owner owns.
create function public.quests_check_goal_owner() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.goal_id is not null and not exists (
    select 1 from public.goals g where g.id = new.goal_id and g.user_id = new.user_id
  ) then
    raise exception 'NOT_FOUND' using errcode = '23503';
  end if;
  return new;
end;
$$;

create trigger quests_check_goal_owner before insert or update of goal_id on public.quests
  for each row execute function public.quests_check_goal_owner();

alter table public.quests enable row level security;

create policy "quests: read own" on public.quests
  for select to authenticated using (user_id = (select auth.uid()));
create policy "quests: insert own" on public.quests
  for insert to authenticated with check (user_id = (select auth.uid()) and status = 'active');
create policy "quests: update own" on public.quests
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "quests: delete own" on public.quests
  for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.quests from anon, authenticated;
grant select, delete on public.quests to authenticated;
grant insert (goal_id, title, description, type, difficulty, xp, primary_stat, deadline, scheduled_for,
              estimated_minutes, repeat_rule, sort_order, source)
  on public.quests to authenticated;
-- status/completed_at move only through RPCs (complete/uncomplete in Phase 5) — except archiving,
-- which goes through archive_quest so a completed quest can't be "un-completed" by hand.
grant update (goal_id, title, description, type, difficulty, xp, primary_stat, deadline, scheduled_for,
              estimated_minutes, repeat_rule, sort_order)
  on public.quests to authenticated;

-- ───────── RPC: archive / unarchive ─────────

create function public.set_quest_archived(p_quest_id uuid, p_archived boolean)
returns public.quests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quest public.quests;
begin
  select * into v_quest from public.quests where id = p_quest_id and user_id = auth.uid() for update;
  if not found then
    raise exception 'QUEST_NOT_FOUND' using errcode = 'P0002';
  end if;

  update public.quests
     set status = case
                    when p_archived then 'archived'::public.quest_status
                    when v_quest.completed_at is not null and v_quest.type <> 'daily' then 'completed'::public.quest_status
                    else 'active'::public.quest_status
                  end
   where id = p_quest_id
  returning * into v_quest;
  return v_quest;
end;
$$;

revoke all on function public.set_quest_archived(uuid, boolean) from public, anon;
grant execute on function public.set_quest_archived(uuid, boolean) to authenticated;

create function public.set_goal_archived(p_goal_id uuid, p_archived boolean)
returns public.goals
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_goal public.goals;
begin
  update public.goals
     set status = case
                    when p_archived then 'archived'::public.goal_status
                    when cleared_at is not null then 'cleared'::public.goal_status
                    else 'active'::public.goal_status
                  end
   where id = p_goal_id and user_id = auth.uid()
  returning * into v_goal;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  return v_goal;
end;
$$;

revoke all on function public.set_goal_archived(uuid, boolean) from public, anon;
grant execute on function public.set_goal_archived(uuid, boolean) to authenticated;
