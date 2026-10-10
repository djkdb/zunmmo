import Link from "next/link";

import { PixelBar } from "@/components/pixel/PixelBar";
import { PixelFrame } from "@/components/pixel/PixelFrame";
import { PixelTag } from "@/components/pixel/PixelTag";
import type { GameDate } from "@/lib/game";
import { formatXpGain } from "@/lib/utils/format";

import { deadlineStatus } from "./deadline";
import { MonsterSprite } from "./monster/MonsterSprite";
import { BOSS_MONSTER } from "./monster/monster";

interface BossBannerProps {
  title: string;
  deadline: GameDate;
  today: GameDate;
  xp: number;
  href: string;
  /** Prep done (0–1) when the boss closes a questline — the boss's HP goes down as it rises. */
  readiness?: number | null;
}

/**
 * The nearest boss as a wanted poster (UI_GUIDE §5.2): the dragon, parchment, crimson D-day
 * stamp. A questline boss shows HP — every prep step done takes some off.
 */
export function BossBanner({ title, deadline, today, xp, href, readiness }: BossBannerProps) {
  const status = deadlineStatus(deadline, today);
  return (
    <PixelFrame
      as="section"
      variant="parchment"
      aria-label="다가오는 보스"
      className="flex items-center gap-4 p-4"
    >
      <MonsterSprite name={BOSS_MONSTER.name} scale={3} />
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
          {BOSS_MONSTER.label} · 처치 보상 {formatXpGain(xp)}
        </span>
        {readiness != null && (
          <span className="relative z-10 flex items-center gap-2">
            <span className="shrink-0 font-pixel text-pixel text-on-parchment-muted">HP</span>
            <PixelBar
              ratio={1 - readiness}
              tone="boss"
              units={4}
              label="보스 HP"
              valueText={`${Math.round((1 - readiness) * 100)}% — 준비 ${Math.round(readiness * 100)}%`}
              className="flex-1"
            />
            <span className="shrink-0 font-pixel text-pixel text-on-parchment" aria-hidden>
              {Math.round((1 - readiness) * 100)}%
            </span>
          </span>
        )}
      </div>
      <span className="shrink-0 border-2 border-boss-stamp px-2 font-pixel text-pixel-2x text-boss-stamp">
        {status.label}
      </span>
    </PixelFrame>
  );
}
