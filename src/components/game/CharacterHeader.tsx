import type { ReactNode } from "react";

import { levelFromXp, titleForLevel } from "@/lib/game";

import { CharacterSprite, type OutfitPreset } from "./character/CharacterSprite";
import { LevelBadge } from "./LevelBadge";
import { XpBar } from "./XpBar";

interface CharacterHeaderProps {
  name: string;
  outfit: OutfitPreset;
  totalXp: number;
  /** Top-right slot (settings link, etc.). */
  action?: ReactNode;
}

/** "Who am I / what level" — the first thing on the adventure screen (UI_GUIDE §4.1). */
export function CharacterHeader({ name, outfit, totalXp, action }: CharacterHeaderProps) {
  const level = levelFromXp(totalXp);
  return (
    <header className="flex items-center gap-4">
      {/* 3× on mobile, 4× from lg (PIXEL_RULES §1.2) */}
      <span className="lg:hidden">
        <CharacterSprite outfit={outfit} scale={3} label={`${name}의 캐릭터`} />
      </span>
      <span className="hidden lg:block">
        <CharacterSprite outfit={outfit} scale={4} label={`${name}의 캐릭터`} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-title">{name}</span>
            <span className="text-small text-text-muted">{titleForLevel(level).ko}</span>
          </div>
          {action}
        </div>
        <LevelBadge level={level} />
        <XpBar totalXp={totalXp} />
      </div>
    </header>
  );
}
