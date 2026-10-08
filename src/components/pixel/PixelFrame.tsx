import type { ComponentPropsWithoutRef, ElementType } from "react";

import type { QuestType } from "@/lib/game";
import { cn } from "@/lib/utils/cn";

export type PixelFrameVariant = "surface" | "raised" | "parchment" | "wood";

type PixelFrameProps<T extends ElementType> = {
  as?: T;
  variant?: PixelFrameVariant;
  /** 4-unit quest-type color stripe on the left edge. */
  stripe?: QuestType;
  /** Drop the hard shadow (for nested or dense frames). */
  flat?: boolean;
  /** Accent outline for the chosen option in a radio-card group. */
  selected?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

/**
 * Notched pixel panel: 2px outline, inner bevel, hard drop shadow (PIXEL_RULES §6.1).
 * Leave ≥ 8px around it — the outline and shadow paint outside the box.
 */
export function PixelFrame<T extends ElementType = "div">({
  as,
  variant = "surface",
  stripe,
  flat,
  selected,
  className,
  ...props
}: PixelFrameProps<T>) {
  const Component: ElementType = as ?? "div";
  return (
    <Component
      className={cn("pixel-frame", stripe && "pl-5", className)}
      data-variant={variant === "surface" ? undefined : variant}
      data-stripe={stripe}
      data-flat={flat ? "" : undefined}
      data-selected={selected ? "" : undefined}
      {...props}
    />
  );
}
