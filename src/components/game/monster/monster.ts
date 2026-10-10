import type { QuestType, Stat } from "@/lib/game";

import type { MonsterName } from "./monsters.generated";

export interface MonsterInfo {
  name: MonsterName;
  /** Shown as the enemy's name (UI_GUIDE §5.3). */
  label: string;
}

/** Each stat's quests are a different enemy; every boss is the deadline dragon. */
export const MONSTER_BY_STAT: Readonly<Record<Stat, MonsterInfo>> = {
  vit: { name: "slime", label: "슬라임" },
  int: { name: "tome", label: "마도서 미믹" },
  foc: { name: "watcher", label: "감시자의 눈" },
  soc: { name: "ghost", label: "수다 유령" },
  cre: { name: "wisp", label: "불꽃 도깨비" },
};

export const BOSS_MONSTER: MonsterInfo = { name: "dragon", label: "마감 드래곤" };

export function monsterFor(type: QuestType, stat: Stat): MonsterInfo {
  return type === "boss" ? BOSS_MONSTER : MONSTER_BY_STAT[stat];
}
