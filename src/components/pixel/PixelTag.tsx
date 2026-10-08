import type { ReactNode } from "react";

import type { QuestType } from "@/lib/game";
import { cn } from "@/lib/utils/cn";

export type PixelTagTone = QuestType | "xp" | "muted";

/** Small outlined pixel label (quest type, XP reward). */
export function PixelTag({
  tone = "muted",
  className,
  children,
}: {
  tone?: PixelTagTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn("pixel-tag h-4 font-pixel text-pixel whitespace-nowrap", className)}
      data-tone={tone}
    >
      {children}
    </span>
  );
}
