-- Beta success metrics (PRODUCT_SPEC §9), straight from the game tables — no tracking
-- pixels or third-party analytics. Run as an operator in the Supabase SQL editor (never from
-- the app). Every query aggregates; none returns per-user rows.

-- 1. Activation: share of sign-ups who complete a quest within 24 hours.
select
  count(*) as signups,
  count(*) filter (where first_done <= u.created_at + interval '24 hours') as activated,
  round(100.0 * count(*) filter (where first_done <= u.created_at + interval '24 hours') / nullif(count(*), 0), 1) as activation_pct
from auth.users u
left join lateral (
  select min(c.completed_at) as first_done from public.quest_completions c where c.user_id = u.id
) f on true
where u.created_at < now() - interval '24 hours';

-- 2. Day-7 retention: share of sign-ups (at least 8 days old) who complete something on day 7.
select
  count(*) as cohort,
  count(*) filter (where exists (
    select 1 from public.quest_completions c
    where c.user_id = u.id
      and c.completed_at >= u.created_at + interval '7 days'
      and c.completed_at < u.created_at + interval '8 days'
  )) as retained,
  round(100.0 * count(*) filter (where exists (
    select 1 from public.quest_completions c
    where c.user_id = u.id
      and c.completed_at >= u.created_at + interval '7 days'
      and c.completed_at < u.created_at + interval '8 days'
  )) / nullif(count(*), 0), 1) as d7_pct
from auth.users u
where u.created_at < now() - interval '8 days';

-- Active day = a (player, game day) with at least one completion.
with active_days as (
  select user_id, occurrence_date, count(*) as completions
  from public.quest_completions
  group by user_id, occurrence_date
)
-- 3. Adventure start rate and 4. quests per active day.
select
  count(*) as active_days,
  round(100.0 * count(a.id) / nullif(count(*), 0), 1) as adventure_start_pct,
  round(avg(d.completions), 2) as quests_per_active_day
from active_days d
left join public.adventures a on a.user_id = d.user_id and a.game_date = d.occurrence_date;

-- 5. Recommendation keep: share of picked quests that were completed the same game day.
-- (Players cannot remove single picks yet, so "kept" is measured as "played".)
select
  count(*) as picked,
  count(c.id) as completed,
  round(100.0 * count(c.id) / nullif(count(*), 0), 1) as keep_pct
from public.adventures a
cross join lateral unnest(a.quest_ids) as picked(quest_id)
left join public.quest_completions c
  on c.quest_id = picked.quest_id and c.occurrence_date = a.game_date;

-- 6. Time-to-complete is a UI property (one tap on the dashboard check), verified by the
--    e2e suite rather than measured here.
