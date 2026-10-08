"use server";

import { redirect } from "next/navigation";

import { playerToday, requireCharacter } from "@/features/player/queries";
import { createClient } from "@/lib/supabase/server";

import { recommendationFor } from "./recommendation";

/**
 * START TODAY'S ADVENTURE (and "다시 추천받기"): recompute the deterministic pick and fix it
 * for the rest of the game day. Moves no XP, so a plain own-row upsert is enough.
 */
export async function startAdventure(): Promise<void> {
  const player = await requireCharacter();
  const today = playerToday(player);
  const recommendation = await recommendationFor(player, today);
  if (recommendation.picks.length > 0) {
    const supabase = await createClient();
    const { error } = await supabase.from("adventures").upsert(
      {
        game_date: today,
        quest_ids: recommendation.picks.map((p) => p.questId),
        source: "auto",
        started_at: new Date().toISOString(),
      },
      { onConflict: "user_id,game_date" },
    );
    if (error) throw error;
  }
  redirect("/adventure");
}
