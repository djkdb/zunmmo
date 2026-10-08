/**
 * Wall-clock ↔ instant conversion in the player's IANA timezone, using only Intl
 * (no date library). Schedules are entered as local date + time and stored as timestamptz.
 */

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    formatters.set(timeZone, f);
  }
  return f;
}

function wallParts(at: Date, timeZone: string) {
  const p = Object.fromEntries(
    formatter(timeZone)
      .formatToParts(at)
      .map((x) => [x.type, x.value]),
  );
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour),
    minute: Number(p.minute),
  };
}

/** Local calendar date and "HH:MM" of an instant. */
export function toLocal(at: Date, timeZone: string): { date: string; time: string } {
  const { year, month, day, hour, minute } = wallParts(at, timeZone);
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return { date: `${pad(year, 4)}-${pad(month)}-${pad(day)}`, time: `${pad(hour)}:${pad(minute)}` };
}

/** Offset (ms) of `timeZone` from UTC at `at`. */
function offsetAt(at: Date, timeZone: string): number {
  const { year, month, day, hour, minute } = wallParts(at, timeZone);
  return Date.UTC(year, month - 1, day, hour, minute) - Math.floor(at.getTime() / 60_000) * 60_000;
}

/** "2026-10-10" + "15:00" in Asia/Seoul → the matching instant. */
export function fromLocal(date: string, time: string, timeZone: string): Date {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const [hh, mm] = time.split(":").map(Number) as [number, number];
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  // Two passes settle DST edges: the offset at the guess can differ from the final one.
  let at = wall - offsetAt(new Date(wall), timeZone);
  at = wall - offsetAt(new Date(at), timeZone);
  return new Date(at);
}

/** Minutes between two instants, never negative. */
export function minutesBetween(from: Date, to: Date): number {
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 60_000));
}
