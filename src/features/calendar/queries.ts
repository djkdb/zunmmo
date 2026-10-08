import "server-only";

import type { Player } from "@/features/player/queries";
import { type GameDate, addDays } from "@/lib/game";
import { createClient } from "@/lib/supabase/server";
import { fromLocal, minutesBetween, toLocal } from "@/lib/utils/zoned";

import { occurrencesBetween } from "./recurrence";

export interface ScheduleView {
  /** Series id (the stored row). */
  id: string;
  /** Unique per occurrence: `${id}:${date}`. */
  key: string;
  title: string;
  /** Local calendar date of this occurrence. */
  date: GameDate;
  startTime: string;
  endTime: string | null;
  allDay: boolean;
  location: string | null;
  quest: { id: string; title: string } | null;
  /** Time it blocks (0 for all-day; 60 when no end is set). */
  minutes: number;
  /** Weekly repeat of the series this occurrence belongs to. */
  repeat: { weekdays: number[]; until: GameDate | null } | null;
}

/** The stored series, for the edit form. */
export interface ScheduleSeriesView {
  id: string;
  title: string;
  date: GameDate;
  startTime: string;
  endTime: string | null;
  allDay: boolean;
  location: string | null;
  questId: string | null;
  repeat: { weekdays: number[]; until: GameDate | null } | null;
  skip: GameDate[];
}

/** A schedule without an end time blocks an hour of the day's capacity. */
export const DEFAULT_SCHEDULE_MINUTES = 60;

const COLUMNS =
  "id, title, starts_at, ends_at, all_day, location, quest_id, repeat_weekdays, repeat_until, skip_dates, quests (id, title)";

type Row = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  location: string | null;
  quest_id: string | null;
  repeat_weekdays: number[] | null;
  repeat_until: string | null;
  skip_dates: string[];
  quests: { id: string; title: string } | null;
};

function toSeries(row: Row, tz: string): ScheduleSeriesView {
  const start = toLocal(new Date(row.starts_at), tz);
  return {
    id: row.id,
    title: row.title,
    date: start.date,
    startTime: start.time,
    endTime: row.ends_at ? toLocal(new Date(row.ends_at), tz).time : null,
    allDay: row.all_day,
    location: row.location,
    questId: row.quest_id,
    repeat: row.repeat_weekdays ? { weekdays: row.repeat_weekdays, until: row.repeat_until } : null,
    skip: row.skip_dates,
  };
}

/**
 * Schedule occurrences on local dates `from`..`to` (inclusive), earliest first. Weekly series
 * keep their local wall time on every occurrence (features/calendar/recurrence.ts).
 */
export async function listSchedules(
  player: Pick<Player, "profile">,
  from: GameDate,
  to: GameDate,
): Promise<ScheduleView[]> {
  const tz = player.profile.timezone;
  const supabase = await createClient();
  const rangeEnd = fromLocal(addDays(to, 1), "00:00", tz).toISOString();
  const [single, recurring] = await Promise.all([
    supabase
      .from("schedules")
      .select(COLUMNS)
      .is("repeat_weekdays", null)
      .gte("starts_at", fromLocal(from, "00:00", tz).toISOString())
      .lt("starts_at", rangeEnd),
    supabase
      .from("schedules")
      .select(COLUMNS)
      .not("repeat_weekdays", "is", null)
      .lt("starts_at", rangeEnd)
      .or(`repeat_until.is.null,repeat_until.gte.${from}`),
  ]);
  if (single.error) throw single.error;
  if (recurring.error) throw recurring.error;

  const views: ScheduleView[] = [];
  for (const row of [...single.data, ...recurring.data] as Row[]) {
    const series = toSeries(row, tz);
    const start = new Date(row.starts_at);
    const end = row.ends_at ? new Date(row.ends_at) : null;
    const minutes = row.all_day ? 0 : end ? minutesBetween(start, end) : DEFAULT_SCHEDULE_MINUTES;
    const dates = occurrencesBetween(
      {
        startDate: series.date,
        weekdays: series.repeat?.weekdays ?? null,
        until: series.repeat?.until ?? null,
        skip: series.skip,
      },
      from,
      to,
    );
    for (const date of dates) {
      views.push({
        id: row.id,
        key: `${row.id}:${date}`,
        title: row.title,
        date,
        startTime: series.startTime,
        endTime: series.endTime,
        allDay: row.all_day,
        location: row.location,
        quest: row.quests,
        minutes,
        repeat: series.repeat,
      });
    }
  }
  return views.sort((a, b) =>
    a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date < b.date ? -1 : 1,
  );
}

/** One stored schedule (series) for editing; null if it is not the player's. */
export async function getScheduleSeries(
  player: Pick<Player, "profile">,
  id: string,
): Promise<ScheduleSeriesView | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schedules")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toSeries(data as Row, player.profile.timezone) : null;
}
