import Link from "next/link";
import type { ReactNode } from "react";

import { PixelStars } from "@/components/pixel/PixelStars";
import type { Difficulty } from "@/lib/game";
import { cn } from "@/lib/utils/cn";
import { formatXpGain } from "@/lib/utils/format";

interface QuestRowProps {
  title: string;
  difficulty: Difficulty;
  xp: number;
  completed?: boolean;
  action?: ReactNode;
  href?: string;
}

/** Compact 56px row for DAILY lists — no frame, divider only (UI_GUIDE §5.2). */
export function QuestRow({ title, difficulty, xp, completed, action, href }: QuestRowProps) {
  return (
    <li className="relative flex min-h-14 items-center gap-3 border-b border-border py-1.5 last:border-b-0">
      <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5", completed && "opacity-60")}>
        {href ? (
          <Link
            href={href}
            className="truncate text-title after:absolute after:inset-0 hover:underline focus-visible:underline"
          >
            {title}
          </Link>
        ) : (
          <span className="truncate text-title">{title}</span>
        )}
        <span className="flex items-center gap-2">
          <PixelStars value={difficulty} />
          <span className="font-pixel text-pixel text-xp-text">{formatXpGain(xp)}</span>
        </span>
      </div>
      {action && <div className="relative z-10">{action}</div>}
    </li>
  );
}
