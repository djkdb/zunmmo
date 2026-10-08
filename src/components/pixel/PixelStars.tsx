import { DIFFICULTIES, type Difficulty } from "@/lib/game";
import { cn } from "@/lib/utils/cn";

import { PixelGlyph } from "./PixelIcon";

/** Difficulty as 8×8 pixel stars — never emoji (PIXEL_RULES §6.5). */
export function PixelStars({ value, className }: { value: Difficulty; className?: string }) {
  return (
    <span
      role="img"
      aria-label={`난이도 ${value} / 5`}
      className={cn("inline-flex gap-px", className)}
    >
      {DIFFICULTIES.map((d) => (
        <PixelGlyph key={d} name={d <= value ? "star" : "star-empty"} scale={2} />
      ))}
    </span>
  );
}
