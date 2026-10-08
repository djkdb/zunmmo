import { type GameDate, addDays, daysBetween, isoWeekday, weekdayLabel } from "@/lib/game";

/** A schedule series as stored: first occurrence + optional weekly repeat. */
export interface ScheduleSeries {
  /** Local date of the first occurrence. */
  startDate: GameDate;
  /** ISO weekdays (1 = Mon … 7 = Sun); null = a one-off schedule. */
  weekdays: readonly number[] | null;
  /** Last local date (inclusive). */
  until: GameDate | null;
  /** Occurrences the player skipped. */
  skip: readonly GameDate[];
}

/** Local dates in `from`..`to` (inclusive) on which the series happens, in order. */
export function occurrencesBetween(
  series: ScheduleSeries,
  from: GameDate,
  to: GameDate,
): GameDate[] {
  if (!series.weekdays) {
    return series.startDate >= from && series.startDate <= to ? [series.startDate] : [];
  }
  const first = series.startDate > from ? series.startDate : from;
  const last = series.until && series.until < to ? series.until : to;
  const skip = new Set(series.skip);
  const days = daysBetween(first, last);
  const dates: GameDate[] = [];
  for (let i = 0; i <= days; i++) {
    const date = addDays(first, i);
    if (series.weekdays.includes(isoWeekday(date)) && !skip.has(date)) dates.push(date);
  }
  return dates;
}

/** "매주 월·수", "매일", "매주 화 · 12월 18일까지" */
export function describeRecurrence(weekdays: readonly number[], until: GameDate | null): string {
  const days =
    weekdays.length === 7
      ? "매일"
      : `매주 ${[...weekdays]
          .sort((a, b) => a - b)
          .map(weekdayLabel)
          .join("·")}`;
  if (!until) return days;
  const [, month, day] = until.split("-").map(Number);
  return `${days} · ${month}월 ${day}일까지`;
}
