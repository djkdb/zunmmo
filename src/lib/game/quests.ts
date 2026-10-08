import type { Difficulty, QuestType, Stat } from "./types";
import { type GameDate, daysBetween } from "./time";

/** Form defaults when the player has not chosen (GAME_MASTER §6). */
export const DEFAULT_DIFFICULTY: Readonly<Record<QuestType, Difficulty>> = {
  main: 3,
  daily: 2,
  side: 2,
  boss: 4,
  hidden: 3,
};

/**
 * GAME_MASTER §7 — steps entered together when a questline is created: the first one is small
 * enough to start today, the rest are regular main quests.
 */
export const QUESTLINE_FIRST_STEP_DIFFICULTY: Difficulty = 2;
export const QUESTLINE_NEXT_STEP_DIFFICULTY: Difficulty = 3;
export const MAX_QUESTLINE_STEPS = 10;

export const DEFAULT_STAT: Readonly<Record<QuestType, Stat>> = {
  main: "foc",
  daily: "vit",
  side: "cre",
  boss: "foc",
  hidden: "cre",
};

export type StoredQuestStatus = "active" | "completed" | "expired" | "archived";
export type EffectiveQuestStatus = StoredQuestStatus;

/**
 * Status as the player sees it. "expired" is derived at read time from the deadline —
 * no cron job flips rows, and extending a deadline revives the quest automatically.
 * Never a penalty: expired quests cost no XP (GAME_SYSTEM §1.4).
 */
export function effectiveStatus(
  quest: { status: StoredQuestStatus; deadline: GameDate | null; type: QuestType },
  today: GameDate,
): EffectiveQuestStatus {
  if (quest.status !== "active" || quest.type === "daily" || !quest.deadline) return quest.status;
  return daysBetween(today, quest.deadline) < 0 ? "expired" : "active";
}

/**
 * Main Questline progress (GAME_SYSTEM §3): completed XP / total XP of the linked quests,
 * excluding dailies (they repeat forever) and archived quests.
 */
export function questlineProgress(
  quests: ReadonlyArray<{ type: QuestType; status: StoredQuestStatus; xp: number }>,
): { ratio: number; completed: number; total: number; completedXp: number; totalXp: number } {
  const counted = quests.filter((q) => q.type !== "daily" && q.status !== "archived");
  const totalXp = counted.reduce((sum, q) => sum + q.xp, 0);
  const done = counted.filter((q) => q.status === "completed");
  const completedXp = done.reduce((sum, q) => sum + q.xp, 0);
  return {
    ratio: totalXp === 0 ? 0 : completedXp / totalXp,
    completed: done.length,
    total: counted.length,
    completedXp,
    totalXp,
  };
}
