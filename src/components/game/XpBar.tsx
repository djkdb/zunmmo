import { PixelBar } from "@/components/pixel/PixelBar";
import { levelProgress } from "@/lib/game";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";

interface XpBarProps {
  /** Lifetime XP — level and progress are derived here, never computed in the caller. */
  totalXp: number;
  size?: "sm" | "md";
  className?: string;
}

/** Level progress bar with the in-level numbers outside the bar (UI_GUIDE §5.4). */
export function XpBar({ totalXp, size = "md", className }: XpBarProps) {
  const { level, xpIntoLevel, xpForNextLevel, ratio, isMaxLevel } = levelProgress(totalXp);
  const numbers = isMaxLevel
    ? "MAX"
    : `${formatNumber(xpIntoLevel)} / ${formatNumber(xpForNextLevel)} XP`;
  const spoken = isMaxLevel
    ? `레벨 ${level}, 최고 레벨`
    : `레벨 ${level}, 다음 레벨까지 ${formatNumber(xpForNextLevel - xpIntoLevel)} XP`;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <PixelBar
        ratio={ratio}
        units={size === "sm" ? 4 : undefined}
        label="경험치"
        valueText={spoken}
      />
      <span className="self-end font-pixel text-pixel text-text-muted" aria-hidden>
        {numbers}
      </span>
    </div>
  );
}
