import Link from "next/link";

import type { GameDate } from "@/lib/game";
import { cn } from "@/lib/utils/cn";
import { formatGameDate } from "@/lib/utils/format";

import type { MarkerKind } from "../model";

/** Mini markers + overflow count; the cell's accessible name carries the meaning. */
export function DayMarkers({ markers, extra }: { markers: MarkerKind[]; extra: number }) {
  if (!markers.length) return <span aria-hidden className="h-2" />;
  return (
    <span aria-hidden className="flex h-2 items-center gap-0.5">
      {markers.map((kind, i) => (
        <span key={i} className="pixel-marker" data-kind={kind} />
      ))}
      {extra > 0 && (
        <span className="font-pixel text-pixel leading-none text-text-muted">+{extra}</span>
      )}
    </span>
  );
}

interface DayCellProps {
  date: GameDate;
  href: string;
  today: boolean;
  selected: boolean;
  muted?: boolean;
  /** "월" … shown above the number in the week strip. */
  weekday?: string;
  summary: string;
  markers: MarkerKind[];
  extra: number;
}

export function DayCell({
  date,
  href,
  today,
  selected,
  muted,
  weekday,
  summary,
  markers,
  extra,
}: DayCellProps) {
  const day = Number(date.slice(8));
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={selected ? "date" : undefined}
      aria-label={[formatGameDate(date), today ? "오늘" : "", summary].filter(Boolean).join(", ")}
      className={cn(
        "flex min-h-14 flex-col items-center justify-center gap-1 rounded-sm border py-1.5",
        selected ? "border-accent bg-surface-raised" : "border-transparent hover:bg-surface-raised",
        today && "pixel-today",
        muted && "text-text-muted",
      )}
    >
      {weekday && <span className="text-caption text-text-muted">{weekday}</span>}
      <span className={cn("font-pixel text-pixel", today && "text-xp-text")}>{day}</span>
      <DayMarkers markers={markers} extra={extra} />
    </Link>
  );
}
