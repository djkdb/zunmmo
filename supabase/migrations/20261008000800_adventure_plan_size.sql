-- Today's Adventure can hold up to 12 quests: at most 6 one-off quests plus the day's habits.
-- The 4-week simulation showed a player with eight small routines always losing the same two
-- (medication among them) to the old 6-quest cap (docs/SIMULATION.md).

alter table public.adventures drop constraint adventures_quest_ids_check;
alter table public.adventures
  add constraint adventures_quest_ids_check check (cardinality(quest_ids) between 1 and 12);
