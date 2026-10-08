-- Quests the player took out of a day's adventure (×). The Game Master rests a removed one-off
-- quest for a couple of days instead of offering it again every morning (GAME_MASTER §3,
-- lib/game SNOOZE_DAYS). Plain own-row data under the existing adventures policies; no XP.
-- Not checked against owns_all_quests: a removed quest may be deleted later and the history
-- must not block saving the plan.

alter table public.adventures
  add column removed_quest_ids uuid[] not null default '{}'
    check (cardinality(removed_quest_ids) <= 50);

grant insert (removed_quest_ids) on public.adventures to authenticated;
grant update (removed_quest_ids) on public.adventures to authenticated;
