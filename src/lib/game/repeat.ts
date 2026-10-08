import { z } from "zod";

import { type GameDate, addDays, isoWeekday } from "./time";

/** GAME_SYSTEM §1.5 — simple, Zod-validated repeat rules (stored as quests.repeat_rule jsonb). */
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const RepeatRuleSchema = z.discriminatedUnion("freq", [
  z.object({ freq: z.literal("daily") }),
  z.object({
    freq: z.literal("weekly"),
    weekdays: z.array(z.number().int().min(1).max(7)).min(1).max(7),
  }),
  z.object({ freq: z.literal("weekly_count"), timesPerWeek: z.number().int().min(1).max(6) }),
]);
export type RepeatRule = z.infer<typeof RepeatRuleSchema>;

/** Monday of the ISO week containing `date`. */
export function isoWeekStart(date: GameDate): GameDate {
  return addDays(date, 1 - isoWeekday(date));
}

/**
 * Is a repeating quest due on `date`?
 * `completionsThisWeek` matters only for weekly_count (done N times → rest of the week is clear).
 */
export function isDueOn(rule: RepeatRule, date: GameDate, completionsThisWeek = 0): boolean {
  switch (rule.freq) {
    case "daily":
      return true;
    case "weekly":
      return rule.weekdays.includes(isoWeekday(date));
    case "weekly_count":
      return completionsThisWeek < rule.timesPerWeek;
  }
}

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"] as const;

export function weekdayLabel(day: number): string {
  return WEEKDAY_LABELS[day - 1] ?? "";
}

/** "매일", "월·수·금", "주 3회" */
export function describeRepeat(rule: RepeatRule): string {
  switch (rule.freq) {
    case "daily":
      return "매일";
    case "weekly":
      return rule.weekdays.length === 7
        ? "매일"
        : [...rule.weekdays]
            .sort((a, b) => a - b)
            .map(weekdayLabel)
            .join("·");
    case "weekly_count":
      return `주 ${rule.timesPerWeek}회`;
  }
}
