/**
 * GAME_SYSTEM §1.6 — the "game date" a moment belongs to.
 * A day starts at `dayStartHour` local time (default 04:00), so a 03:59 completion
 * counts toward the previous day — late-night players keep their streaks.
 */
export const DEFAULT_TIMEZONE = "Asia/Seoul";
export const DEFAULT_DAY_START_HOUR = 4;

/** ISO calendar date, e.g. "2026-10-08". */
export type GameDate = string;

const partsFormatterCache = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = partsFormatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    });
    partsFormatterCache.set(timeZone, formatter);
  }
  return formatter;
}

function localParts(now: Date, timeZone: string) {
  const parts = Object.fromEntries(
    formatterFor(timeZone)
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
  };
}

function toIsoDate(year: number, month: number, day: number): GameDate {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Shift an ISO date by whole days using pure calendar arithmetic (no DST involvement). */
export function addDays(date: GameDate, days: number): GameDate {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const shifted = new Date(Date.UTC(y, m - 1, d + days));
  return toIsoDate(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
}

export function gameDate(
  now: Date,
  timeZone: string = DEFAULT_TIMEZONE,
  dayStartHour: number = DEFAULT_DAY_START_HOUR,
): GameDate {
  const { year, month, day, hour } = localParts(now, timeZone);
  const today = toIsoDate(year, month, day);
  return hour < dayStartHour ? addDays(today, -1) : today;
}

/** ISO weekday of a game date: 1 = Monday … 7 = Sunday. */
export function isoWeekday(date: GameDate): number {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return weekday === 0 ? 7 : weekday;
}

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: GameDate, to: GameDate): number {
  const toUtc = (date: GameDate) => {
    const [y, m, d] = date.split("-").map(Number) as [number, number, number];
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(to) - toUtc(from)) / 86_400_000);
}
