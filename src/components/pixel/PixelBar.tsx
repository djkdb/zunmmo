import type { CSSProperties } from "react";

import type { Stat } from "@/lib/game";
import { cn } from "@/lib/utils/cn";

export type PixelBarTone = "xp" | Stat | "success" | "boss";

interface PixelBarProps {
  /** 0..1 — clamped. The fill snaps to whole pixel units in CSS. */
  ratio: number;
  tone?: PixelBarTone;
  /**
   * Height in pixel units (1 unit = 2px). Omit for the XP size: 5 units, 6 from `lg` (UI_GUIDE §6.3).
   * Stat bars use 4.
   */
  units?: number;
  /** Accessible name, e.g. "레벨 24 경험치". */
  label: string;
  /** Spoken value, e.g. "1,000 중 420 XP". */
  valueText?: string;
  className?: string;
}

/** Flat 3-band pixel progress bar (PIXEL_RULES §6.3). Text belongs outside the bar. */
export function PixelBar({
  ratio,
  tone = "xp",
  units,
  label,
  valueText,
  className,
}: PixelBarProps) {
  const clamped = Math.min(1, Math.max(0, Number.isFinite(ratio) ? ratio : 0));
  const percent = Math.round(clamped * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={valueText}
      className={cn("pixel-bar w-full", className)}
      data-tone={tone === "xp" ? undefined : tone}
      style={
        {
          "--bar-ratio": clamped,
          ...(units === undefined ? {} : { "--bar-units": units }),
        } as CSSProperties
      }
    >
      <div className="pixel-bar__fill" />
    </div>
  );
}
