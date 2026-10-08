import "server-only";

import type { GameDate } from "@/lib/game";
import { createClient } from "@/lib/supabase/server";

export interface AdventureView {
  questIds: string[];
  briefing: string | null;
  source: "auto" | "custom";
  startedAt: string;
  /** Quests the player took out of this plan (×). */
  removedQuestIds: string[];
}

/** The adventure started for `today`, if any. */
export async function getAdventure(today: GameDate): Promise<AdventureView | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("adventures")
    .select("quest_ids, briefing, source, started_at, removed_quest_ids")
    .eq("game_date", today)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    questIds: data.quest_ids,
    briefing: data.briefing,
    source: data.source as AdventureView["source"],
    startedAt: data.started_at,
    removedQuestIds: data.removed_quest_ids,
  };
}

/** Quests taken out of plans on game days `from`..today, for the GM to rest (SNOOZE_DAYS). */
export async function listRecentRemovals(
  from: GameDate,
): Promise<Array<{ date: GameDate; questIds: string[] }>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("adventures")
    .select("game_date, removed_quest_ids")
    .gte("game_date", from);
  if (error) throw error;
  return data
    .filter((row) => row.removed_quest_ids.length > 0)
    .map((row) => ({ date: row.game_date, questIds: row.removed_quest_ids }));
}
