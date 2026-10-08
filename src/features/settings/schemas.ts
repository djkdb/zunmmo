import { z } from "zod";

import { CharacterNameSchema, OUTFITS } from "@/features/character/schemas";

/** Day-start choices: midnight to noon (profiles.day_start_hour check). */
export const DAY_START_HOURS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
/** Daily adventure capacity, in 30-minute steps (profiles.daily_capacity_min check). */
export const CAPACITY_CHOICES = [60, 90, 120, 180, 240, 300, 360, 480] as const;

/** Time zones offered in settings: the common ones first, all IANA zones accepted. */
export const COMMON_TIMEZONES = [
  "Asia/Seoul",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
] as const;

function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export const PreferencesSchema = z.object({
  timezone: z.string().refine(isTimeZone, "알 수 없는 시간대예요."),
  dayStartHour: z.coerce.number().int().min(0).max(12),
  dailyCapacityMin: z.coerce.number().int().min(30).max(960),
});

export const CharacterSettingsSchema = z.object({
  name: CharacterNameSchema,
  outfit: z.enum(OUTFITS, "외형을 골라 주세요."),
});

/** Typed confirmation for account deletion. */
export const DELETE_CONFIRMATION = "삭제";

export function hourLabel(hour: number): string {
  if (hour === 0) return "자정 (0시)";
  if (hour === 12) return "정오 (12시)";
  return `${hour < 12 ? "오전" : "오후"} ${hour}시`;
}
