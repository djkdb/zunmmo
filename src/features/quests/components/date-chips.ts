import { type GameDate, addDays, isoWeekday } from "@/lib/game";

/** Quick deadline choices relative to the player's game date (GAME_MASTER §6). */
export function deadlineChips(today: GameDate): Array<{ label: string; date: GameDate }> {
  const weekday = isoWeekday(today);
  const friday = addDays(today, (5 - weekday + 7) % 7); // today if Friday, else the coming Friday
  const nextMonday = addDays(today, 8 - weekday);
  const chips = [
    { label: "오늘", date: today },
    { label: "내일", date: addDays(today, 1) },
    { label: weekday <= 5 ? "이번 주 금요일" : "다음 주 금요일", date: friday },
    { label: "다음 주 월요일", date: nextMonday },
  ];
  // Drop duplicates (e.g. Thursday: 내일 == 금요일).
  return chips.filter((chip, i) => chips.findIndex((c) => c.date === chip.date) === i);
}
