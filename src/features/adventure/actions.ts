"use server";

import { redirect } from "next/navigation";

import { playerToday, requireCharacter } from "@/features/player/queries";
import { createClient } from "@/lib/supabase/server";

import { listCompletionsSince } from "@/features/progress/queries";
import { listQuests } from "@/features/quests/queries";

import { briefingFor, completionWindowStart, recommendationFor } from "./recommendation";

/**
 * START TODAY'S ADVENTURE (and "다시 추천받기"): recompute the deterministic pick and fix it
 * for the rest of the game day. Moves no XP, so a plain own-row upsert is enough.
 */
export async function startAdventure(): Promise<void> {
  const player = await requireCharacter();
  const today = playerToday(player);
  const [quests, completions] = await Promise.all([
    listQuests(today),
    listCompletionsSince(completionWindowStart(today)),
  ]);
  const recommendation = await recommendationFor(player, today, { quests, completions });
  if (recommendation.picks.length > 0) {
    const gm = await briefingFor(player, today, { quests, completions }, recommendation);
    const supabase = await createClient();
    const { error } = await supabase.from("adventures").upsert(
      {
        game_date: today,
        quest_ids: recommendation.picks.map((p) => p.questId),
        briefing: gm.line,
        source: "auto",
        started_at: new Date().toISOString(),
      },
      { onConflict: "user_id,game_date" },
    );
    if (error) throw error;
  }
  redirect("/adventure");
}
