/** Core game vocabulary. See docs/GAME_SYSTEM.md. */

export const QUEST_TYPES = ["main", "daily", "side", "boss", "hidden"] as const;
export type QuestType = (typeof QUEST_TYPES)[number];

export const DIFFICULTIES = [1, 2, 3, 4, 5] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const STATS = ["int", "foc", "vit", "soc", "cre"] as const;
export type Stat = (typeof STATS)[number];

export function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === "number" && (DIFFICULTIES as readonly number[]).includes(value);
}

export function isQuestType(value: unknown): value is QuestType {
  return typeof value === "string" && (QUEST_TYPES as readonly string[]).includes(value);
}

export function isStat(value: unknown): value is Stat {
  return typeof value === "string" && (STATS as readonly string[]).includes(value);
}

/** XP totals are stored as non-negative integers; anything else is clamped. */
export function sanitizeXp(xp: number): number {
  return Number.isFinite(xp) && xp > 0 ? Math.floor(xp) : 0;
}
