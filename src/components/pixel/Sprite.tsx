"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";

import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { cn } from "@/lib/utils/cn";

import { type ScaleProp, ap } from "./scale";

export interface SpriteAnimation {
  /** Row in the sheet. */
  row: number;
  frames: number;
  /** Milliseconds per frame. */
  durations: readonly number[];
  loop: boolean;
}

interface SpriteProps {
  src: string;
  frameSize: { readonly w: number; readonly h: number };
  sheetSize: { readonly w: number; readonly h: number };
  animation: SpriteAnimation;
  /** Integer scale, or "inherit" to follow the `--pixel-scale` CSS variable. */
  scale?: ScaleProp;
  /** Freeze on the first frame. Forced on when the user prefers reduced motion. */
  paused?: boolean;
  /** Called once when a non-looping animation finishes. */
  onEnd?: () => void;
  label?: string;
  className?: string;
}

/**
 * Frame-stepped sprite sheet player (PIXEL_RULES §2, §7).
 * Remount with a new `key` to restart from frame 0 when switching animations.
 */
export function Sprite({
  src,
  frameSize,
  sheetSize,
  animation,
  scale = 4,
  paused = false,
  onEnd,
  label,
  className,
}: SpriteProps) {
  const reducedMotion = useReducedMotion();
  const [frame, setFrame] = useState(0);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  });

  const frozen = paused || reducedMotion;
  const { frames, durations, loop, row } = animation;

  useEffect(() => {
    if (frozen || frames <= 1) return;
    const isLast = frame === frames - 1;
    const timer = window.setTimeout(
      () => {
        if (isLast && !loop) {
          onEndRef.current?.();
          return;
        }
        setFrame((current) => (current + 1) % frames);
      },
      durations[frame] ?? durations[0] ?? 150,
    );
    return () => window.clearTimeout(timer);
  }, [frame, frames, durations, loop, frozen]);

  const shown = frozen ? 0 : frame;
  const style: CSSProperties = {
    width: ap(frameSize.w, scale),
    height: ap(frameSize.h, scale),
    backgroundImage: `url(${src})`,
    backgroundSize: `${ap(sheetSize.w, scale)} ${ap(sheetSize.h, scale)}`,
    backgroundPosition: `${ap(-shown * frameSize.w, scale)} ${ap(-row * frameSize.h, scale)}`,
    backgroundRepeat: "no-repeat",
  };

  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("pixel-art inline-block shrink-0", className)}
      style={style}
    />
  );
}
