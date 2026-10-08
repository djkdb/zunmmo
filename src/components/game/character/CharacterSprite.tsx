"use client";

import { type PixelScale } from "@/components/pixel/PixelIcon";
import { Sprite } from "@/components/pixel/Sprite";
import { cn } from "@/lib/utils/cn";

import { SPRITE_SHEETS } from "./sprite-sheets.generated";

const SHEET = SPRITE_SHEETS.adventurer;

/** Outfit color presets offered at onboarding (CHARACTER_GUIDE §3). */
export type OutfitPreset = keyof typeof SHEET.images;
export const OUTFIT_PRESETS = Object.keys(SHEET.images) as OutfitPreset[];

/** Every state the data model supports (CHARACTER_GUIDE §5); art fills in phase by phase. */
export const CHARACTER_STATES = [
  "idle",
  "walking",
  "running",
  "studying",
  "working",
  "exercising",
  "thinking",
  "celebrating",
  "sleeping",
  "surprised",
  "level-up",
] as const;
export type CharacterState = (typeof CHARACTER_STATES)[number];

type DrawnState = keyof typeof SHEET.states;

/** Undrawn states resolve through this chain until they reach a drawn one. */
const FALLBACKS: Record<CharacterState, CharacterState> = {
  idle: "idle",
  walking: "idle",
  running: "walking",
  studying: "idle",
  working: "idle",
  exercising: "idle",
  thinking: "idle",
  celebrating: "idle",
  sleeping: "idle",
  surprised: "celebrating",
  "level-up": "celebrating",
};

function isDrawn(state: CharacterState): state is DrawnState {
  return state in SHEET.states;
}

export function resolveCharacterState(state: CharacterState): DrawnState {
  let current = state;
  for (let i = 0; i < CHARACTER_STATES.length; i++) {
    if (isDrawn(current)) return current;
    current = FALLBACKS[current];
  }
  return "idle";
}

interface CharacterSpriteProps {
  outfit: OutfitPreset;
  state?: CharacterState;
  scale?: PixelScale;
  /** Accessible name, e.g. "성준의 캐릭터". */
  label: string;
  /** Pixel ground shadow under the feet. */
  shadow?: boolean;
  paused?: boolean;
  onAnimationEnd?: () => void;
  className?: string;
}

export function CharacterSprite({
  outfit,
  state = "idle",
  scale = 4,
  label,
  shadow = true,
  paused,
  onAnimationEnd,
  className,
}: CharacterSpriteProps) {
  const drawn = resolveCharacterState(state);
  const animation = SHEET.states[drawn];
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      {shadow && (
        <span
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 bg-ink-950/40"
          style={{
            // 16×2ap ellipse with notched ends, sitting on the feet baseline (CHARACTER_GUIDE §2)
            width: 16 * scale,
            height: 2 * scale,
            top: (SHEET.anchor.y - 0.5) * scale,
            clipPath: `polygon(${2 * scale}px 0, calc(100% - ${2 * scale}px) 0, 100% 50%, calc(100% - ${2 * scale}px) 100%, ${2 * scale}px 100%, 0 50%)`,
          }}
        />
      )}
      <Sprite
        key={drawn}
        src={SHEET.images[outfit]}
        frameSize={SHEET.frameSize}
        sheetSize={SHEET.sheetSize}
        animation={animation}
        scale={scale}
        paused={paused}
        onEnd={onAnimationEnd}
        label={label}
        className="relative"
      />
    </span>
  );
}
