import type { GameDate } from "@/lib/game";

import type { CalendarView } from "./model";

export function calendarHref(view: CalendarView, date: GameDate): string {
  return view === "week" ? `/calendar?d=${date}` : `/calendar?view=month&d=${date}`;
}
