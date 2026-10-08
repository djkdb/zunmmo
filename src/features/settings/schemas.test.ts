import { describe, expect, it } from "vitest";

import { CharacterSettingsSchema, PreferencesSchema, hourLabel } from "./schemas";

describe("settings schemas", () => {
  it("accepts real IANA zones and bounded numbers", () => {
    expect(
      PreferencesSchema.parse({
        timezone: "America/New_York",
        dayStartHour: "4",
        dailyCapacityMin: "240",
      }),
    ).toEqual({ timezone: "America/New_York", dayStartHour: 4, dailyCapacityMin: 240 });
    expect(
      PreferencesSchema.safeParse({
        timezone: "Mars/Olympus",
        dayStartHour: 4,
        dailyCapacityMin: 240,
      }).success,
    ).toBe(false);
    expect(
      PreferencesSchema.safeParse({ timezone: "UTC", dayStartHour: 13, dailyCapacityMin: 240 })
        .success,
    ).toBe(false);
    expect(
      PreferencesSchema.safeParse({ timezone: "UTC", dayStartHour: 4, dailyCapacityMin: 10 })
        .success,
    ).toBe(false);
  });

  it("validates character edits like onboarding", () => {
    expect(CharacterSettingsSchema.safeParse({ name: " ", outfit: "royal" }).success).toBe(false);
    expect(CharacterSettingsSchema.parse({ name: " 하린 ", outfit: "ember" })).toEqual({
      name: "하린",
      outfit: "ember",
    });
  });

  it("labels day-start hours", () => {
    expect(hourLabel(0)).toBe("자정 (0시)");
    expect(hourLabel(4)).toBe("오전 4시");
    expect(hourLabel(12)).toBe("정오 (12시)");
  });
});
