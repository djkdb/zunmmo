"use server";

import { redirect } from "next/navigation";

import { playerToday, requireCharacter } from "@/features/player/queries";
import { listCompletionsSince } from "@/features/progress/queries";
import { listQuests } from "@/features/quests/queries";
import { type Result, codeFromDbError, fail, ok } from "@/lib/errors";
import { MAX_PLAN_SIZE } from "@/lib/game";
import { createClient } from "@/lib/supabase/server";

import { getAdventure } from "./queries";
import { completionWindowStart, planToday } from "./recommendation";

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
  const { recommendation, briefing } = await planToday(player, today, { quests, completions });
  if (recommendation.picks.length > 0) {
    const supabase = await createClient();
    const { error } = await supabase.from("adventures").upsert(
      {
        game_date: today,
        quest_ids: recommendation.picks.map((p) => p.questId),
        briefing: briefing.line,
        source: "auto",
        started_at: new Date().toISOString(),
      },
      { onConflict: "user_id,game_date" },
    );
    if (error) throw error;
  }
  redirect("/adventure");
}

// ───────── editing the plan (GM suggests, the player decides — CLAUDE.md) ─────────

async function savePicks(
  today: string,
  questIds: string[],
): Promise<Result<{ questIds: string[] }>> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("adventures")
    .update({ quest_ids: questIds, source: "custom" })
    .eq("game_date", today);
  if (error) return fail(codeFromDbError(error));
  return ok({ questIds });
}

/** Take a quest out of today's adventure (it stays on the board). */
export async function removeFromAdventure(
  questId: string,
): Promise<Result<{ questIds: string[] }>> {
  const player = await requireCharacter();
  const today = playerToday(player);
  const adventure = await getAdventure(today);
  if (!adventure) return fail("ADVENTURE_NOT_STARTED");
  if (!adventure.questIds.includes(questId)) return fail("QUEST_NOT_FOUND");
  if (adventure.questIds.length <= 1) return fail("ADVENTURE_LAST_PICK");
  return savePicks(
    today,
    adventure.questIds.filter((id) => id !== questId),
  );
}

/** Add a quest the GM did not pick — only one that can be played today. */
export async function addToAdventure(questId: string): Promise<Result<{ questIds: string[] }>> {
  const player = await requireCharacter();
  const today = playerToday(player);
  const adventure = await getAdventure(today);
  if (!adventure) return fail("ADVENTURE_NOT_STARTED");
  if (adventure.questIds.includes(questId)) return ok({ questIds: adventure.questIds });
  if (adventure.questIds.length >= MAX_PLAN_SIZE) return fail("ADVENTURE_FULL");
  const { recommendation } = await planToday(player, today);
  if (!recommendation.candidates.some((c) => c.questId === questId))
    return fail("QUEST_NOT_ELIGIBLE");
  return savePicks(today, [...adventure.questIds, questId]);
}
