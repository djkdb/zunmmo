import type { CSSProperties } from "react";

import { type ScaleProp, ap } from "@/components/pixel/scale";
import { cn } from "@/lib/utils/cn";

import { MONSTER_SHEETS, type MonsterName } from "./monsters.generated";

interface MonsterSpriteProps {
  name: MonsterName;
  /** Idle bobs in two stepped frames (CSS only, frozen under reduced motion); defeated is the grey frame. */
  state?: "idle" | "defeated";
  scale?: ScaleProp;
  className?: string;
}

/** A quest's enemy. Decorative — the card's title and tags carry the meaning. */
export function MonsterSprite({ name, state = "idle", scale = 2, className }: MonsterSpriteProps) {
  const { src, w, h, frames } = MONSTER_SHEETS[name];
  const style = {
    "--monster-w": ap(w, scale),
    width: ap(w, scale),
    height: ap(h, scale),
    backgroundImage: `url(${src})`,
    backgroundSize: `${ap(w * frames, scale)} ${ap(h, scale)}`,
    backgroundPosition: state === "defeated" ? `calc(var(--monster-w) * -2) 0` : "0 0",
    backgroundRepeat: "no-repeat",
  } as CSSProperties;
  return (
    <span
      aria-hidden
      className={cn(
        "pixel-art inline-block shrink-0",
        state === "idle" && "monster-idle",
        className,
      )}
      style={style}
    />
  );
}
