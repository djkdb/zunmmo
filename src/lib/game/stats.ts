import type { Stat } from "./types";
import { sanitizeXp } from "./types";

/**
 * GAME_SYSTEM §5 — stats are a growth record, not an evaluation.
 * statLevel = floor(sqrt(statXp / STAT_XP_FACTOR)): fast early, gentle later.
 */
export const STAT_XP_FACTOR = 50;

export function statLevel(statXp: number): number {
  return Math.floor(Math.sqrt(sanitizeXp(statXp) / STAT_XP_FACTOR));
}

export function statXpToReachLevel(level: number): number {
  const n = Math.max(0, Math.floor(level));
  return STAT_XP_FACTOR * n * n;
}

export function statProgress(statXp: number): { level: number; ratio: number } {
  const xp = sanitizeXp(statXp);
  const level = statLevel(xp);
  const floor = statXpToReachLevel(level);
  const next = statXpToReachLevel(level + 1);
  return { level, ratio: (xp - floor) / (next - floor) };
}

/** GAME_SYSTEM §5.1 — default stat for a quest category (AI / form default). */
export const QUEST_CATEGORIES = [
  "study",
  "work",
  "project",
  "health",
  "exercise",
  "sleep",
  "social",
  "family",
  "hobby",
  "creative",
  "play",
  "chore",
  "admin",
] as const;
export type QuestCategory = (typeof QUEST_CATEGORIES)[number];

export const CATEGORY_STAT: Readonly<Record<QuestCategory, Stat>> = {
  study: "int",
  work: "foc",
  project: "foc",
  health: "vit",
  exercise: "vit",
  sleep: "vit",
  social: "soc",
  family: "soc",
  hobby: "cre",
  creative: "cre",
  play: "cre",
  chore: "foc",
  admin: "foc",
};
