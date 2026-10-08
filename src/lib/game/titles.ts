import { MAX_LEVEL } from "./level";

export interface Title {
  ko: string;
  en: string;
}

/** GAME_SYSTEM §4.4 — level-band titles, ordered by `minLevel` ascending. */
export const LEVEL_TITLES: ReadonlyArray<{ minLevel: number; title: Title }> = [
  { minLevel: 1, title: { ko: "견습 모험가", en: "Novice" } },
  { minLevel: 5, title: { ko: "모험가", en: "Adventurer" } },
  { minLevel: 10, title: { ko: "숙련 모험가", en: "Journeyman" } },
  { minLevel: 20, title: { ko: "베테랑", en: "Veteran" } },
  { minLevel: 35, title: { ko: "영웅", en: "Hero" } },
  { minLevel: 50, title: { ko: "전설", en: "Legend" } },
  { minLevel: 75, title: { ko: "신화", en: "Mythic" } },
];

export function titleForLevel(level: number): Title {
  const n = Math.min(MAX_LEVEL, Math.max(1, Math.floor(level)));
  let current = LEVEL_TITLES[0]!.title;
  for (const band of LEVEL_TITLES) {
    if (n >= band.minLevel) current = band.title;
  }
  return current;
}
