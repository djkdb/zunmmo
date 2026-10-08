import { PixelIcon } from "@/components/pixel/PixelIcon";
import { PixelBar } from "@/components/pixel/PixelBar";
import { type Stat, statProgress } from "@/lib/game";

import { STAT_META } from "./quest-meta";

/** One stat as icon + label + level + bar. Never compared against other people. */
export function StatBar({ stat, xp }: { stat: Stat; xp: number }) {
  const { level, ratio } = statProgress(xp);
  const meta = STAT_META[stat];
  return (
    <div className="grid grid-cols-[auto_3rem_1fr_2rem] items-center gap-x-2">
      <PixelIcon name={meta.icon} />
      <span className="flex flex-col leading-none">
        <span className="font-pixel text-pixel text-text">{meta.label}</span>
        <span className="text-caption text-text-muted">{meta.ko}</span>
      </span>
      <PixelBar
        ratio={ratio}
        tone={stat}
        units={4}
        label={`${meta.ko} 성장`}
        valueText={`레벨 ${level}`}
      />
      <span className="text-right font-pixel text-pixel text-text" aria-hidden>
        {level}
      </span>
    </div>
  );
}
