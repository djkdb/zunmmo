import type { Difficulty, QuestType } from "./types";

/** GAME_SYSTEM §1.2 — base XP by difficulty (⭐ … ⭐⭐⭐⭐⭐). */
export const DIFFICULTY_XP: Readonly<Record<Difficulty, number>> = {
  1: 20,
  2: 40,
  3: 70,
  4: 120,
  5: 200,
};

/** GAME_SYSTEM §1.3 — quest type multipliers. ⭐5 BOSS = 500 XP. */
export const QUEST_TYPE_MULTIPLIER: Readonly<Record<QuestType, number>> = {
  main: 1,
  daily: 1,
  side: 1,
  boss: 2.5,
  hidden: 1.5,
};

/**
 * XP granted for completing a quest. Snapshotted into `quests.xp` at creation time,
 * so later rule changes never rewrite history. AI never outputs XP — only this does.
 */
export function questXp(type: QuestType, difficulty: Difficulty): number {
  return Math.round(DIFFICULTY_XP[difficulty] * QUEST_TYPE_MULTIPLIER[type]);
}

/** GAME_SYSTEM §3 — Main Questline clear bonus. */
export const GOAL_CLEAR_BONUS = { ratio: 0.2, min: 200, max: 1000 } as const;

export function goalClearBonus(questXpSum: number): number {
  const { ratio, min, max } = GOAL_CLEAR_BONUS;
  const raw = Math.round(Math.max(0, questXpSum) * ratio);
  return Math.min(max, Math.max(min, raw));
}
