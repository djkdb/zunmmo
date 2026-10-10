import { CharacterSprite, type OutfitPreset } from "@/components/game/character/CharacterSprite";
import { PixelBar } from "@/components/pixel/PixelBar";
import { PixelFrame } from "@/components/pixel/PixelFrame";
import { SceneTileStrip } from "@/components/pixel/SceneSprite";
import { ap } from "@/components/pixel/scale";
import { josa } from "@/lib/game";
import { formatXpGain } from "@/lib/utils/format";

import { BattleMonster } from "./monster/BattleMonster";
import type { MonsterInfo } from "./monster/monster";

const SCALE = 3;
/** Ground tile height (scene-sprites ground is 16ap). */
const GROUND = 16;

interface BattleSceneProps {
  hero: { name: string; outfit: OutfitPreset; level: number };
  monster: MonsterInfo;
  /** Enemy level = quest difficulty. */
  level: number;
  xp: number;
  defeated: boolean;
  /** Deadline passed: the enemy waits for a retry — never a loss (GAME_SYSTEM §1.4). */
  waiting?: boolean;
  /** Enemy HP 0–1. A questline boss loses HP as its prep steps are done. */
  hp: number;
}

/**
 * The quest as an encounter (UI_GUIDE §5.6): the player's adventurer facing the quest's enemy on
 * a night field, name plates with the enemy's HP, and a one-line battle message. Completing the
 * quest (the card's check) plays the enemy's defeat sequence here.
 */
export function BattleScene({ hero, monster, level, xp, defeated, waiting, hp }: BattleSceneProps) {
  const message = defeated
    ? `${josa(monster.label, "을", "를")} 쓰러뜨렸다! ${formatXpGain(xp)}`
    : waiting
      ? `${josa(monster.label, "이", "가")} 아직 기다리고 있다. 다시 도전해 볼까?`
      : `야생의 ${josa(monster.label, "이", "가")} 나타났다!`;
  const hpRatio = defeated ? 0 : hp;

  return (
    <PixelFrame as="section" aria-label="전투" className="overflow-hidden p-0">
      <div
        className="relative w-full bg-battle-sky"
        style={{ height: ap(GROUND + 32 + 22, SCALE) }}
      >
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-3 text-on-battle">
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-pixel text-pixel">{hero.name}</span>
            <span className="font-pixel text-pixel text-on-battle-muted">Lv.{hero.level}</span>
          </div>
          <div className="flex w-36 min-w-0 flex-col items-end gap-1">
            <span className="max-w-full truncate font-pixel text-pixel">
              {monster.label} Lv.{level}
            </span>
            <PixelBar
              ratio={hpRatio}
              tone="boss"
              units={4}
              label={`${monster.label} HP`}
              valueText={`${Math.round(hpRatio * 100)}%`}
              className="w-full"
            />
          </div>
        </div>

        <span className="absolute left-6 sm:left-16" style={{ bottom: ap(GROUND - 2, SCALE) }}>
          <CharacterSprite
            outfit={hero.outfit}
            state={defeated ? "celebrating" : "idle"}
            scale={SCALE}
            label={`${hero.name}의 캐릭터`}
          />
        </span>
        <span className="absolute right-6 sm:right-16" style={{ bottom: ap(GROUND - 1, SCALE) }}>
          <BattleMonster name={monster.name} defeated={defeated} scale={SCALE} />
        </span>

        <SceneTileStrip name="ground" scale={SCALE} className="absolute inset-x-0 bottom-0" />
      </div>
      <p className="border-t-2 border-outline px-4 py-3 font-pixel text-pixel text-text">
        {message}
      </p>
    </PixelFrame>
  );
}
