import { sanitizeXp } from "./types";

/** GAME_SYSTEM §4 — swappable level curve. Levels are derived from total XP, never stored. */
export type LevelCurve =
  | { kind: "linear"; step: number }
  | { kind: "polynomial"; base: number; exponent: number };

export const LEVEL_CURVE: LevelCurve = { kind: "linear", step: 1000 };
export const MAX_LEVEL = 99;

/** Cumulative XP required to reach `level` (level 1 = 0 XP). */
export function xpToReachLevel(level: number, curve: LevelCurve = LEVEL_CURVE): number {
  const n = Math.min(MAX_LEVEL, Math.max(1, Math.floor(level)));
  switch (curve.kind) {
    case "linear":
      return curve.step * (n - 1);
    case "polynomial":
      return Math.round(curve.base * (n - 1) ** curve.exponent);
  }
}

export function levelFromXp(totalXp: number, curve: LevelCurve = LEVEL_CURVE): number {
  const xp = sanitizeXp(totalXp);
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpToReachLevel(level + 1, curve)) level++;
  return level;
}

export interface LevelProgress {
  level: number;
  /** XP earned inside the current level. */
  xpIntoLevel: number;
  /** XP span of the current level (0 at max level). */
  xpForNextLevel: number;
  /** 0..1 progress toward the next level (1 at max level). */
  ratio: number;
  isMaxLevel: boolean;
}

export function levelProgress(totalXp: number, curve: LevelCurve = LEVEL_CURVE): LevelProgress {
  const xp = sanitizeXp(totalXp);
  const level = levelFromXp(xp, curve);
  const floor = xpToReachLevel(level, curve);
  if (level >= MAX_LEVEL) {
    return { level, xpIntoLevel: xp - floor, xpForNextLevel: 0, ratio: 1, isMaxLevel: true };
  }
  const span = xpToReachLevel(level + 1, curve) - floor;
  const xpIntoLevel = xp - floor;
  return { level, xpIntoLevel, xpForNextLevel: span, ratio: xpIntoLevel / span, isMaxLevel: false };
}

export function detectLevelUp(
  xpBefore: number,
  xpAfter: number,
  curve: LevelCurve = LEVEL_CURVE,
): { from: number; to: number } | null {
  const from = levelFromXp(xpBefore, curve);
  const to = levelFromXp(xpAfter, curve);
  return to > from ? { from, to } : null;
}
