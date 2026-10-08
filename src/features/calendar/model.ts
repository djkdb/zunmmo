import type { CompletionLog } from "@/features/progress/queries";
import type { QuestView } from "@/features/quests/queries";
import { type GameDate, type QuestType, addDays, isDueOn, isoWeekStart } from "@/lib/game";

import type { ScheduleView } from "./queries";

export type CalendarView = "week" | "month";

/** Monday–Sunday of the week containing `date`. */
export function weekDates(date: GameDate): GameDate[] {
  const start = isoWeekStart(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Weeks (Mon-first) covering the month of `date`, padded with neighbouring days. */
export function monthGrid(date: GameDate): Array<Array<{ date: GameDate; inMonth: boolean }>> {
  const month = date.slice(0, 7);
  const first = `${month}-01`;
  let cursor = isoWeekStart(first);
  const weeks: Array<Array<{ date: GameDate; inMonth: boolean }>> = [];
  do {
    weeks.push(
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(cursor, i);
        return { date: d, inMonth: d.startsWith(month) };
      }),
    );
    cursor = addDays(cursor, 7);
  } while (cursor.startsWith(month));
  return weeks;
}

/** Same day of the previous/next month, clamped to the month's length. */
export function shiftMonth(date: GameDate, months: number): GameDate {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const day = Math.min(d, lastDay);
  return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export interface DayItems {
  /** One-off quests whose deadline is this day. */
  deadlines: QuestView[];
  /** Repeating quests due this day (today and later only — the past shows completions). */
  dailies: QuestView[];
  schedules: ScheduleView[];
  /** Quests completed on this game day. */
  completed: QuestView[];
}

export function dayItems(
  date: GameDate,
  today: GameDate,
  data: {
    quests: readonly QuestView[];
    schedules: readonly ScheduleView[];
    completions: readonly CompletionLog[];
  },
): DayItems {
  const completedIds = new Set(
    data.completions.filter((c) => c.occurrenceDate === date).map((c) => c.questId),
  );
  const open = data.quests.filter((q) => q.status !== "archived");
  return {
    deadlines: open.filter(
      (q) => q.type !== "daily" && q.deadline === date && !completedIds.has(q.id),
    ),
    dailies:
      date >= today
        ? open.filter(
            (q) =>
              q.type === "daily" &&
              q.repeat &&
              q.repeat.freq !== "weekly_count" &&
              isDueOn(q.repeat, date) &&
              !completedIds.has(q.id),
          )
        : [],
    schedules: data.schedules.filter((s) => s.date === date),
    completed: data.quests.filter((q) => completedIds.has(q.id)),
  };
}

export type MarkerKind = Exclude<QuestType, "daily"> | "schedule" | "done";

const MAX_MARKERS = 3;

/** Up to three mini pixel markers for a date cell (bosses first) + the overflow count. */
export function dayMarkers(items: DayItems): { markers: MarkerKind[]; extra: number } {
  const order: Record<string, number> = { boss: 0, main: 1, side: 2, hidden: 3 };
  const all: MarkerKind[] = [
    ...[...items.deadlines]
      .sort((a, b) => (order[a.type] ?? 9) - (order[b.type] ?? 9))
      .map((q) => q.type as MarkerKind),
    ...items.schedules.map(() => "schedule" as const),
    ...items.completed.map(() => "done" as const),
  ];
  return { markers: all.slice(0, MAX_MARKERS), extra: Math.max(0, all.length - MAX_MARKERS) };
}

/** Screen-reader summary for a date cell — markers are never the only signal. */
export function describeDay(items: DayItems): string {
  const parts: string[] = [];
  if (items.deadlines.length) parts.push(`마감 ${items.deadlines.length}개`);
  if (items.schedules.length) parts.push(`일정 ${items.schedules.length}개`);
  if (items.completed.length) parts.push(`완료 ${items.completed.length}개`);
  return parts.join(", ");
}
