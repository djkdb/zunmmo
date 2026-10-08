import { describe, expect, it } from "vitest";

import { addDays, daysBetween, gameDate, isoWeekday } from "../time";

describe("gameDate", () => {
  it("uses the local calendar date of the given timezone", () => {
    // 2026-10-08 00:30 UTC = 09:30 KST
    expect(gameDate(new Date("2026-10-08T00:30:00Z"), "Asia/Seoul")).toBe("2026-10-08");
    // 2026-10-08 16:00 UTC = 01:00 KST on the 9th → before 04:00, still the 8th
    expect(gameDate(new Date("2026-10-08T16:00:00Z"), "Asia/Seoul")).toBe("2026-10-08");
  });

  it("rolls over exactly at dayStartHour", () => {
    // 18:59 UTC = 03:59 KST (9th) → game day 8th; 19:00 UTC = 04:00 KST → 9th
    expect(gameDate(new Date("2026-10-08T18:59:59Z"), "Asia/Seoul", 4)).toBe("2026-10-08");
    expect(gameDate(new Date("2026-10-08T19:00:00Z"), "Asia/Seoul", 4)).toBe("2026-10-09");
  });

  it("supports a midnight day start", () => {
    expect(gameDate(new Date("2026-10-08T15:00:00Z"), "Asia/Seoul", 0)).toBe("2026-10-09");
  });

  it("crosses month and year boundaries", () => {
    // 2027-01-01 02:00 KST → game day 2026-12-31
    expect(gameDate(new Date("2026-12-31T17:00:00Z"), "Asia/Seoul", 4)).toBe("2026-12-31");
  });

  it("is stable across a DST transition (America/New_York, 2026-11-01)", () => {
    // 01:30 EST after fall-back → before 04:00 → previous day
    expect(gameDate(new Date("2026-11-01T06:30:00Z"), "America/New_York", 4)).toBe("2026-10-31");
    // 04:30 EST → same day
    expect(gameDate(new Date("2026-11-01T09:30:00Z"), "America/New_York", 4)).toBe("2026-11-01");
  });
});

describe("date helpers", () => {
  it("addDays handles month/leap boundaries", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("isoWeekday is 1=Mon … 7=Sun", () => {
    expect(isoWeekday("2026-10-08")).toBe(4);
    expect(isoWeekday("2026-10-11")).toBe(7);
    expect(isoWeekday("2026-10-12")).toBe(1);
  });

  it("daysBetween counts whole calendar days", () => {
    expect(daysBetween("2026-10-08", "2026-10-12")).toBe(4);
    expect(daysBetween("2026-10-12", "2026-10-08")).toBe(-4);
  });
});
