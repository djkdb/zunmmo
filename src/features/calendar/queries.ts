import "server-only";

import type { Player } from "@/features/player/queries";
import { type GameDate, addDays } from "@/lib/game";
import { createClient } from "@/lib/supabase/server";
import { fromLocal, minutesBetween, toLocal } from "@/lib/utils/zoned";

export interface ScheduleView {
  id: string;
  title: string;
  /** Local calendar date the schedule starts on. */
  date: GameDate;
  startTime: string;
  endTime: string | null;
  allDay: boolean;
  location: string | null;
  quest: { id: string; title: string } | null;
  /** Time it blocks (0 for all-day; 60 when no end is set). */
  minutes: number;
}

/** A schedule without an end time blocks an hour of the day's capacity. */
export const DEFAULT_SCHEDULE_MINUTES = 60;

/** Schedules starting on local dates `from`..`to` (inclusive), earliest first. */
export async function listSchedules(
  player: Pick<Player, "profile">,
  from: GameDate,
  to: GameDate,
): Promise<ScheduleView[]> {
  const tz = player.profile.timezone;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schedules")
    .select("id, title, starts_at, ends_at, all_day, location, quests (id, title)")
    .gte("starts_at", fromLocal(from, "00:00", tz).toISOString())
    .lt("starts_at", fromLocal(addDays(to, 1), "00:00", tz).toISOString())
    .order("starts_at");
  if (error) throw error;
  return data.map((row) => {
    const start = new Date(row.starts_at);
    const end = row.ends_at ? new Date(row.ends_at) : null;
    const local = toLocal(start, tz);
    return {
      id: row.id,
      title: row.title,
      date: local.date,
      startTime: local.time,
      endTime: end ? toLocal(end, tz).time : null,
      allDay: row.all_day,
      location: row.location,
      quest: row.quests,
      minutes: row.all_day ? 0 : end ? minutesBetween(start, end) : DEFAULT_SCHEDULE_MINUTES,
    };
  });
}
