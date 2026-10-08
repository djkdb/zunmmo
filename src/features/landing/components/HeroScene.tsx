import type { CSSProperties } from "react";

import { CharacterSprite } from "@/components/game/character/CharacterSprite";
import { SceneSprite, SceneTileStrip } from "@/components/pixel/SceneSprite";
import { ap } from "@/components/pixel/scale";
import { cn } from "@/lib/utils/cn";

/** Scene geometry in art pixels (ap). Props stand 2ap into the grass. */
const SCENE_HEIGHT = 88;
const GROUND = 16;
const STAND_LINE = GROUND - 3; // sprite bottom rows are empty/outline → feet on the grass
const GROUP_WIDTH = 112;

/** Star field: x in % of width, y in ap from the top. Snapped to whole art pixels in CSS. */
const STARS: ReadonlyArray<{ x: number; y: number; gold?: boolean; twinkle?: boolean }> = [
  { x: 6, y: 10 },
  { x: 14, y: 28, twinkle: true },
  { x: 23, y: 6, gold: true },
  { x: 31, y: 20 },
  { x: 42, y: 12, twinkle: true },
  { x: 55, y: 5 },
  { x: 61, y: 24, gold: true, twinkle: true },
  { x: 72, y: 14 },
  { x: 88, y: 30, twinkle: true },
  { x: 94, y: 8 },
];

const snap = (length: string) => `round(down, ${length}, calc(1px * var(--pixel-scale, 4)))`;

function at(x: number, bottom: number): CSSProperties {
  return { position: "absolute", left: ap(x, "inherit"), bottom: ap(bottom, "inherit") };
}

/**
 * Night village hero: quest board with a waiting "!", lantern light and the player's
 * adventurer. Pure CSS layout on the art-pixel grid; 3× / 4× / 5× by breakpoint.
 */
export function HeroScene({ className }: { className?: string }) {
  return (
    <div
      className={cn("pixel-scale-responsive relative w-full overflow-hidden", className)}
      style={{ height: ap(SCENE_HEIGHT, "inherit") }}
      role="img"
      aria-label="밤의 마을 퀘스트 게시판 앞에 선 모험가"
    >
      {STARS.map((star, i) => (
        <span
          key={i}
          aria-hidden
          className={cn(
            "absolute",
            star.gold ? "bg-gold-200" : "bg-ink-200",
            star.twinkle && "pixel-twinkle",
          )}
          style={{
            left: snap(`${star.x}%`),
            top: ap(star.y, "inherit"),
            width: ap(1, "inherit"),
            height: ap(1, "inherit"),
            animationDelay: `${i * 370}ms`,
          }}
        />
      ))}

      <SceneSprite
        name="moon"
        className="absolute"
        style={{ right: snap("12%"), top: ap(6, "inherit") }}
      />

      <div
        className="absolute bottom-0"
        style={{
          left: snap(`calc(50% - ${ap(GROUP_WIDTH / 2, "inherit")})`),
          width: ap(GROUP_WIDTH, "inherit"),
          height: "100%",
        }}
      >
        <SceneSprite name="bush" style={at(0, STAND_LINE)} />
        <SceneSprite name="quest-board" style={at(14, STAND_LINE)} />
        <span className="pixel-bob" style={at(22, STAND_LINE + 32)}>
          <SceneSprite name="quest-marker" />
        </span>
        <span style={at(46, STAND_LINE - 1)}>
          <CharacterSprite outfit="royal" scale="inherit" label="모험가" shadow={false} />
        </span>
        {/* Lantern glow: notched light squares centered on the glass, stepped flicker (no blur). */}
        <span
          aria-hidden
          className="pixel-flicker absolute bg-gold-200/10"
          style={{
            left: ap(82, "inherit"),
            bottom: ap(STAND_LINE + 20, "inherit"),
            width: ap(12, "inherit"),
            height: ap(12, "inherit"),
            clipPath: `polygon(${ap(2, "inherit")} 0, calc(100% - ${ap(2, "inherit")}) 0, 100% ${ap(2, "inherit")}, 100% calc(100% - ${ap(2, "inherit")}), calc(100% - ${ap(2, "inherit")}) 100%, ${ap(2, "inherit")} 100%, 0 calc(100% - ${ap(2, "inherit")}), 0 ${ap(2, "inherit")})`,
          }}
        />
        <SceneSprite name="lantern" style={at(80, STAND_LINE)} />
        <SceneSprite name="bush" style={at(96, STAND_LINE)} />
      </div>

      <SceneTileStrip name="ground" className="absolute inset-x-0 bottom-0" />
    </div>
  );
}
