-- Phase 5: completions, the XP ledger, questline clears and achievement badges.
-- Every XP movement happens inside one SECURITY DEFINER function = one transaction,
-- and is written to xp_logs (the ledger). characters.total_xp / character_stats.xp are caches.

create type public.xp_reason as enum ('quest_complete', 'goal_clear', 'achievement', 'streak_bonus', 'reversal', 'admin_adjust');

-- ───────── game date (must match src/lib/game/time.ts gameDate) ─────────

-- The player's calendar day at p_at: local wall-clock time minus the day-start hour.
create function public.game_date_at(p_timezone text, p_day_start_hour integer, p_at timestamptz)
returns date
language sql
stable
set search_path = ''
as $$
  select ((p_at at time zone p_timezone) - make_interval(hours => p_day_start_hour))::date;
$$;

create function public.player_game_date(p_user uuid)
returns date
language sql
stable
security definer
set search_path = ''
as $$
  select public.game_date_at(p.timezone, p.day_start_hour, now())
  from public.profiles p where p.id = p_user;
$$;

revoke all on function public.player_game_date(uuid) from public, anon, authenticated;

-- ───────── quest_completions (one row per completed occurrence) ─────────

create table public.quest_completions (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  occurrence_date date not null,
  completed_at timestamptz not null default now(),
  -- ★ The double-grant guard: one completion per quest per game day.
  constraint quest_completions_once_per_day unique (quest_id, occurrence_date)
);

create index quest_completions_user_date_idx on public.quest_completions (user_id, occurrence_date desc);

alter table public.quest_completions enable row level security;
create policy "quest_completions: read own" on public.quest_completions
  for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.quest_completions from anon, authenticated;
grant select on public.quest_completions to authenticated;

-- ───────── xp_logs (ledger — never deleted, corrected by reversals) ─────────

create table public.xp_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  character_id uuid not null references public.characters (id) on delete cascade,
  quest_id uuid references public.quests (id) on delete set null,
  completion_id uuid references public.quest_completions (id) on delete set null,
  goal_id uuid references public.goals (id) on delete set null,
  amount integer not null check (amount <> 0),
  stat public.stat_type,
  reason public.xp_reason not null,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now(),
  constraint xp_logs_only_reversals_negative check (amount > 0 or reason in ('reversal', 'admin_adjust'))
);

create index xp_logs_user_created_idx on public.xp_logs (user_id, created_at desc);

alter table public.xp_logs enable row level security;
create policy "xp_logs: read own" on public.xp_logs
  for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.xp_logs from anon, authenticated;
grant select on public.xp_logs to authenticated;

-- Hard-deleting a quest that already paid XP would orphan its history: archive instead.
drop policy "quests: delete own" on public.quests;
create policy "quests: delete own unplayed" on public.quests
  for delete to authenticated using (
    user_id = (select auth.uid())
    -- Qualify quests.id: an unqualified `id` would bind to quest_completions.id.
    and not exists (select 1 from public.quest_completions c where c.quest_id = quests.id)
  );

-- ───────── RPC: complete_quest ─────────

create type public.xp_result as (
  quest_id uuid,
  completion_id uuid,
  occurrence_date date,
  xp_change integer,
  total_xp_before bigint,
  total_xp_after bigint,
  stat public.stat_type,
  stat_xp_after bigint
);

create function public.complete_quest(p_quest_id uuid)
returns public.xp_result
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_quest public.quests;
  v_character_id uuid;
  v_date date;
  v_completion_id uuid;
  v_result public.xp_result;
begin
  if v_user is null then
    raise exception 'UNAUTHENTICATED' using errcode = '28000';
  end if;

  select * into v_quest from public.quests where id = p_quest_id and user_id = v_user for update;
  if not found then
    raise exception 'QUEST_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_quest.status <> 'active' then
    raise exception 'QUEST_NOT_ACTIVE' using errcode = 'P0001';
  end if;

  select id into v_character_id from public.characters where user_id = v_user;
  if v_character_id is null then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  v_date := public.player_game_date(v_user);

  begin
    insert into public.quest_completions (quest_id, user_id, occurrence_date)
    values (v_quest.id, v_user, v_date)
    returning id into v_completion_id;
  exception when unique_violation then
    raise exception 'ALREADY_COMPLETED' using errcode = '23505';
  end;

  insert into public.xp_logs (user_id, character_id, quest_id, completion_id, goal_id, amount, stat, reason, meta)
  values (
    v_user, v_character_id, v_quest.id, v_completion_id, v_quest.goal_id, v_quest.xp, v_quest.primary_stat,
    'quest_complete',
    jsonb_build_object('type', v_quest.type, 'difficulty', v_quest.difficulty, 'game_date', v_date)
  );

  update public.characters set total_xp = total_xp + v_quest.xp
   where id = v_character_id
  returning total_xp into v_result.total_xp_after;

  update public.character_stats set xp = xp + v_quest.xp
   where character_id = v_character_id and stat = v_quest.primary_stat
  returning xp into v_result.stat_xp_after;

  if v_quest.type <> 'daily' then
    update public.quests set status = 'completed', completed_at = now() where id = v_quest.id;
  end if;

  v_result.quest_id := v_quest.id;
  v_result.completion_id := v_completion_id;
  v_result.occurrence_date := v_date;
  v_result.xp_change := v_quest.xp;
  v_result.total_xp_before := v_result.total_xp_after - v_quest.xp;
  v_result.stat := v_quest.primary_stat;
  return v_result;
end;
$$;

-- ───────── RPC: uncomplete_quest (same game day only) ─────────

create function public.uncomplete_quest(p_quest_id uuid)
returns public.xp_result
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_quest public.quests;
  v_completion public.quest_completions;
  v_log public.xp_logs;
  v_result public.xp_result;
begin
  if v_user is null then
    raise exception 'UNAUTHENTICATED' using errcode = '28000';
  end if;

  select * into v_quest from public.quests where id = p_quest_id and user_id = v_user for update;
  if not found then
    raise exception 'QUEST_NOT_FOUND' using errcode = 'P0002';
  end if;

  select * into v_completion from public.quest_completions
   where quest_id = v_quest.id and occurrence_date = public.player_game_date(v_user);
  if not found then
    raise exception 'UNDO_WINDOW_PASSED' using errcode = 'P0001';
  end if;

  select * into v_log from public.xp_logs
   where completion_id = v_completion.id and reason = 'quest_complete';

  -- Ledger: correct with a reversal entry, never delete.
  insert into public.xp_logs (user_id, character_id, quest_id, goal_id, amount, stat, reason, meta)
  values (
    v_user, v_log.character_id, v_quest.id, v_quest.goal_id, -v_log.amount, v_log.stat, 'reversal',
    jsonb_build_object('reverses', v_log.id, 'game_date', v_completion.occurrence_date)
  );

  update public.characters set total_xp = total_xp - v_log.amount
   where id = v_log.character_id
  returning total_xp into v_result.total_xp_after;

  update public.character_stats set xp = xp - v_log.amount
   where character_id = v_log.character_id and stat = v_log.stat
  returning xp into v_result.stat_xp_after;

  delete from public.quest_completions where id = v_completion.id;

  if v_quest.type <> 'daily' and v_quest.status = 'completed' then
    update public.quests set status = 'active', completed_at = null where id = v_quest.id;
  end if;

  v_result.quest_id := v_quest.id;
  v_result.completion_id := null;
  v_result.occurrence_date := v_completion.occurrence_date;
  v_result.xp_change := -v_log.amount;
  v_result.total_xp_before := v_result.total_xp_after + v_log.amount;
  v_result.stat := v_log.stat;
  return v_result;
end;
$$;

-- ───────── RPC: clear_goal (questline clear bonus) ─────────
-- The bonus amount is computed by lib/game goalClearBonus() in the server action; the DB
-- bounds it and verifies the questline is really finished. Once per questline.

create function public.clear_goal(p_goal_id uuid, p_bonus integer)
returns public.xp_result
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_goal public.goals;
  v_character_id uuid;
  v_result public.xp_result;
begin
  if v_user is null then
    raise exception 'UNAUTHENTICATED' using errcode = '28000';
  end if;
  if p_bonus < 0 or p_bonus > 1000 then
    raise exception 'VALIDATION_FAILED' using errcode = '22023';
  end if;

  select * into v_goal from public.goals where id = p_goal_id and user_id = v_user for update;
  if not found or v_goal.status <> 'active' then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  if not exists (
    select 1 from public.quests q where q.goal_id = v_goal.id and q.type in ('main', 'boss') and q.status <> 'archived'
  ) or exists (
    select 1 from public.quests q where q.goal_id = v_goal.id and q.type in ('main', 'boss') and q.status = 'active'
  ) then
    raise exception 'QUEST_NOT_ACTIVE' using errcode = 'P0001';
  end if;

  select id into v_character_id from public.characters where user_id = v_user;

  update public.goals set status = 'cleared', cleared_at = now() where id = v_goal.id;

  insert into public.xp_logs (user_id, character_id, goal_id, amount, reason, meta)
  values (
    v_user, v_character_id, v_goal.id, p_bonus, 'goal_clear',
    jsonb_build_object('title', v_goal.title, 'game_date', public.player_game_date(v_user))
  );

  update public.characters set total_xp = total_xp + p_bonus
   where id = v_character_id
  returning total_xp into v_result.total_xp_after;

  v_result.xp_change := p_bonus;
  v_result.total_xp_before := v_result.total_xp_after - p_bonus;
  return v_result;
end;
$$;

revoke all on function public.complete_quest(uuid) from public, anon;
revoke all on function public.uncomplete_quest(uuid) from public, anon;
revoke all on function public.clear_goal(uuid, integer) from public, anon;
grant execute on function public.complete_quest(uuid) to authenticated;
grant execute on function public.uncomplete_quest(uuid) to authenticated;
grant execute on function public.clear_goal(uuid, integer) to authenticated;

-- ───────── achievements (badges; the catalog lives in src/lib/game/achievements.ts) ─────────
-- Badges grant no XP, so the only way XP moves stays quest completion + questline clears.

create table public.user_achievements (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  achievement_id text not null check (achievement_id ~ '^[a-z0-9_]{1,40}$'),
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

alter table public.user_achievements enable row level security;
create policy "user_achievements: read own" on public.user_achievements
  for select to authenticated using (user_id = (select auth.uid()));
create policy "user_achievements: unlock own" on public.user_achievements
  for insert to authenticated with check (user_id = (select auth.uid()));
revoke all on public.user_achievements from anon, authenticated;
grant select on public.user_achievements to authenticated;
grant insert (achievement_id) on public.user_achievements to authenticated;

-- ───────── player_progress: aggregates for achievements & streaks ─────────
-- SECURITY INVOKER: runs under the caller's RLS, so it can only ever see their own rows.
create function public.player_progress()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with me as (
    select p.timezone, p.day_start_hour from public.profiles p where p.id = auth.uid()
  ),
  done as (
    select c.occurrence_date, c.completed_at, q.type
    from public.quest_completions c
    join public.quests q on q.id = c.quest_id
  )
  select jsonb_build_object(
    'completions', (select count(*) from done),
    'byType', coalesce((select jsonb_object_agg(type, n) from (select type, count(*) n from done group by type) t), '{}'::jsonb),
    'goalsCleared', (select count(*) from public.goals g where g.status = 'cleared'),
    'earlyBird', (
      select count(*) from done, me
      where extract(hour from (done.completed_at at time zone me.timezone)) < 7
    ),
    'playDates', coalesce((
      select jsonb_agg(d order by d desc)
      from (select distinct occurrence_date::text d from done order by 1 desc limit 400) recent
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.player_progress() from public, anon;
grant execute on function public.player_progress() to authenticated;
