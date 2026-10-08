import "server-only";

import type { GameDate } from "@/lib/game";
import { createClient } from "@/lib/supabase/server";

export interface AdventureView {
  questIds: string[];
  briefing: string | null;
  source: "auto" | "custom";
  startedAt: string;
}

/** The adventure started for `today`, if any. */
export async function getAdventure(today: GameDate): Promise<AdventureView | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("adventures")
    .select("quest_ids, briefing, source, started_at")
    .eq("game_date", today)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    questIds: data.quest_ids,
    briefing: data.briefing,
    source: data.source as AdventureView["source"],
    startedAt: data.started_at,
  };
}
