import Link from "next/link";

import { PixelFrame } from "@/components/pixel/PixelFrame";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { PixelTag } from "@/components/pixel/PixelTag";
import type { GameDate } from "@/lib/game";
import { formatXpGain } from "@/lib/utils/format";

import { deadlineStatus } from "./deadline";

interface BossBannerProps {
  title: string;
  deadline: GameDate;
  today: GameDate;
  xp: number;
  href: string;
}

/** The nearest boss as a wanted poster (UI_GUIDE §5.2): parchment, crimson D-day stamp. */
export function BossBanner({ title, deadline, today, xp, href }: BossBannerProps) {
  const status = deadlineStatus(deadline, today);
  return (
    <PixelFrame
      as="section"
      variant="parchment"
      aria-label="다가오는 보스"
      className="flex items-center gap-4 p-4"
    >
      <PixelIcon name="quest-boss" scale={3} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <PixelTag tone="boss" className="self-start">
          BOSS
        </PixelTag>
        <h2 className="truncate text-title">
          <Link
            href={href}
            className="after:absolute after:inset-0 hover:underline focus-visible:underline focus-visible:outline-none"
          >
            {title}
          </Link>
        </h2>
        <span className="font-pixel text-pixel text-on-parchment-muted">
          처치 보상 {formatXpGain(xp)}
        </span>
      </div>
      <span className="shrink-0 border-2 border-boss-stamp px-2 font-pixel text-pixel-2x text-boss-stamp">
        {status.label}
      </span>
    </PixelFrame>
  );
}
