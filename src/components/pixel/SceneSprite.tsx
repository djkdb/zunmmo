import type { CSSProperties } from "react";

import { cn } from "@/lib/utils/cn";

import { type ScaleProp, ap } from "./scale";
import { SCENE_SPRITES, type SceneSpriteName } from "./scene-sprites.generated";

interface SceneSpriteProps {
  name: SceneSpriteName;
  scale?: ScaleProp;
  className?: string;
  style?: CSSProperties;
}

/** Static scene prop (board, lantern, moon …). Decorative: hidden from assistive tech. */
export function SceneSprite({ name, scale = "inherit", className, style }: SceneSpriteProps) {
  const { src, w, h } = SCENE_SPRITES[name];
  return (
    <span
      aria-hidden
      className={cn("pixel-art block", className)}
      style={{
        width: ap(w, scale),
        height: ap(h, scale),
        backgroundImage: `url(${src})`,
        backgroundSize: "100% 100%",
        ...style,
      }}
    />
  );
}

/** Horizontally repeating tile strip (ground). */
export function SceneTileStrip({ name, scale = "inherit", className }: SceneSpriteProps) {
  const { src, w, h } = SCENE_SPRITES[name];
  return (
    <span
      aria-hidden
      className={cn("pixel-art block w-full", className)}
      style={{
        height: ap(h, scale),
        backgroundImage: `url(${src})`,
        backgroundSize: `${ap(w, scale)} ${ap(h, scale)}`,
        backgroundRepeat: "repeat-x",
      }}
    />
  );
}
