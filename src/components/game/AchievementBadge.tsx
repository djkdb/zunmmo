import { PixelFrame } from "@/components/pixel/PixelFrame";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import type { Rarity } from "@/lib/game";
import { cn } from "@/lib/utils/cn";

import { achievementIcon } from "./achievement-icon";

export const RARITY_META: Record<Rarity, { label: string; ko: string }> = {
  common: { label: "COMMON", ko: "일반" },
  rare: { label: "RARE", ko: "희귀" },
  epic: { label: "EPIC", ko: "영웅" },
  legendary: { label: "LEGENDARY", ko: "전설" },
};

interface AchievementBadgeProps {
  name: string;
  description: string;
  rarity: Rarity;
  icon: string;
  /** Formatted unlock date; absent = still locked. */
  unlockedOn?: string;
}

/**
 * Badge tile: rarity-colored bevel medallion + name. Locked badges keep their goal readable
 * but show the icon as a silhouette and say "잠김" (meaning never by color alone).
 */
export function AchievementBadge({
  name,
  description,
  rarity,
  icon,
  unlockedOn,
}: AchievementBadgeProps) {
  const locked = !unlockedOn;
  return (
    <div className="flex items-start gap-3">
      <PixelFrame
        flat
        variant="raised"
        data-rarity={locked ? undefined : rarity}
        className="flex size-12 shrink-0 items-center justify-center"
      >
        <span className={cn(locked && "opacity-40 brightness-0")}>
          <PixelIcon name={achievementIcon(icon)} scale={2} />
        </span>
      </PixelFrame>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className={cn("text-small font-semibold", locked && "text-text-muted")}>{name}</span>
        <span className="text-caption text-text-muted">{description}</span>
        <span className="font-pixel text-pixel text-text-muted">
          {locked
            ? `잠김 · ${RARITY_META[rarity].label}`
            : `${RARITY_META[rarity].label} · ${unlockedOn}`}
        </span>
      </div>
    </div>
  );
}
