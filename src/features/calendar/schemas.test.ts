import { describe, expect, it } from "vitest";

import { ScheduleInputSchema } from "./schemas";

const base = {
  title: "축구 경기",
  date: "2026-10-10",
  allDay: false,
  startTime: "15:00",
  endTime: "17:00",
  location: "",
  questId: null,
};

describe("ScheduleInputSchema", () => {
  it("accepts a timed schedule and blanks empty text", () => {
    expect(ScheduleInputSchema.parse(base)).toMatchObject({ location: null, startTime: "15:00" });
  });

  it("needs a start time unless all-day, and an end after the start", () => {
    expect(ScheduleInputSchema.safeParse({ ...base, startTime: null }).success).toBe(false);
    expect(
      ScheduleInputSchema.safeParse({ ...base, startTime: null, endTime: null, allDay: true })
        .success,
    ).toBe(true);
    expect(ScheduleInputSchema.safeParse({ ...base, endTime: "14:00" }).success).toBe(false);
  });
});
