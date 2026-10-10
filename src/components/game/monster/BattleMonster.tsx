"use client";

import { useState } from "react";

import type { ScaleProp } from "@/components/pixel/scale";

import { MonsterSprite } from "./MonsterSprite";
import type { MonsterName } from "./monsters.generated";

interface BattleMonsterProps {
  name: MonsterName;
  defeated: boolean;
  scale?: ScaleProp;
  className?: string;
}

/**
 * A quest's enemy that plays the defeat sequence when its quest gets done while on screen
 * (UI_GUIDE §5.3). Already-defeated enemies just lie there; undo brings it back to idle.
 */
export function BattleMonster({ name, defeated, scale = 2, className }: BattleMonsterProps) {
  // Adjust state while rendering when the prop changes (no effect, no extra paint).
  const [seen, setSeen] = useState({ defeated, hits: 0 });
  let hits = seen.hits;
  if (seen.defeated !== defeated) {
    hits = defeated ? seen.hits + 1 : seen.hits;
    setSeen({ defeated, hits });
  }
  const state = !defeated ? "idle" : hits > 0 ? "defeating" : "defeated";
  return <MonsterSprite key={hits} name={name} state={state} scale={scale} className={className} />;
}
