import { type GameDate, isoWeekday, weekdayLabel } from "@/lib/game";
import { cn } from "@/lib/utils/cn";
import { formatXpGain } from "@/lib/utils/format";

/** Tallest column in pixel units; bars are whole units so they stay on the grid. */
const MAX_UNITS = 24;

/**
 * Seven stepped columns of XP per game day — a growth record, not a target to hit
 * (no goal line, no red days).
 */
export function XpWeekChart({
  days,
  today,
}: {
  days: Array<{ date: GameDate; xp: number }>;
  today: GameDate;
}) {
  const peak = Math.max(1, ...days.map((d) => d.xp));
  return (
    <ol className="grid grid-cols-7 items-end gap-2" aria-label="최근 7일 경험치">
      {days.map(({ date, xp }) => {
        const gained = Math.max(0, xp);
        const units = gained === 0 ? 0 : Math.max(1, Math.round((gained / peak) * MAX_UNITS));
        const isToday = date === today;
        const day = weekdayLabel(isoWeekday(date));
        return (
          <li key={date} className="flex flex-col items-center gap-1.5">
            <span className="sr-only">
              {isToday ? "오늘" : `${day}요일`} {formatXpGain(gained)}
            </span>
            <span
              aria-hidden
              className={cn("w-full", gained ? "bg-xp-fill" : "bg-border")}
              style={{ height: `calc(var(--pixel-unit) * ${Math.max(units, 1)})` }}
            />
            <span
              aria-hidden
              className={cn("font-pixel text-pixel", isToday ? "text-xp-text" : "text-text-muted")}
            >
              {isToday ? "오늘" : day}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
