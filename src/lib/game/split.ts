import { questXp } from "./xp";
import { DIFFICULTIES, type Difficulty, type QuestType } from "./types";

/**
 * Splitting a quest that is too big for one day (GAME_MASTER §7). Parts share the original
 * quest's XP: splitting is for finishing, not for farming — at most 20% more in total, as a
 * small thank-you for planning the steps.
 */
export const MIN_SPLIT_PARTS = 2;
export const MAX_SPLIT_PARTS = 6;
export const SPLIT_XP_ALLOWANCE = 1.2;

export type SplittableType = Extract<QuestType, "main" | "side">;

export function isSplittable(type: QuestType): type is SplittableType {
  return type === "main" || type === "side";
}

/** The largest difficulty whose parts together stay within the original's XP allowance. */
export function splitDifficulty(
  type: SplittableType,
  original: Difficulty,
  parts: number,
): Difficulty {
  const budget = questXp(type, original) * SPLIT_XP_ALLOWANCE;
  let best: Difficulty = 1;
  for (const d of DIFFICULTIES) {
    if (d <= original && questXp(type, d) * parts <= budget) best = d;
  }
  return best;
}

/** Each part's estimate: an even share rounded to 5 minutes (at least 5); null stays null. */
export function splitMinutes(minutes: number | null, parts: number): number | null {
  if (minutes === null) return null;
  return Math.max(5, Math.round(minutes / parts / 5) * 5);
}

export interface SplitPart {
  title: string;
  difficulty: Difficulty;
  xp: number;
  estimatedMinutes: number | null;
}

export function splitPlan(
  quest: { type: SplittableType; difficulty: Difficulty; estimatedMinutes: number | null },
  titles: readonly string[],
): SplitPart[] {
  const difficulty = splitDifficulty(quest.type, quest.difficulty, titles.length);
  const minutes = splitMinutes(quest.estimatedMinutes, titles.length);
  return titles.map((title) => ({
    title,
    difficulty,
    xp: questXp(quest.type, difficulty),
    estimatedMinutes: minutes,
  }));
}
