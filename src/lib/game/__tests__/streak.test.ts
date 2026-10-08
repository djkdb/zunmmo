import { describe, expect, it } from "vitest";

import { currentStreak } from "../streak";
import { isoWeekday } from "../time";

describe("currentStreak", () => {
  const today = "2026-10-08";

  it("counts consecutive days ending today", () => {
    expect(currentStreak(["2026-10-08", "2026-10-07", "2026-10-06", "2026-10-04"], today)).toBe(3);
  });

  it("keeps yesterday's streak alive before today is played", () => {
    expect(currentStreak(["2026-10-07", "2026-10-06"], today)).toBe(2);
  });

  it("is zero after a missed day", () => {
    expect(currentStreak(["2026-10-06"], today)).toBe(0);
    expect(currentStreak([], today)).toBe(0);
  });

  it("skips days a weekly habit was not due", () => {
    // Mon/Wed/Fri habit; today Thursday. Done Wed 10-07, Mon 10-05, Fri 10-02.
    const mwf = (d: string) => [1, 3, 5].includes(isoWeekday(d));
    expect(currentStreak(["2026-10-07", "2026-10-05", "2026-10-02"], today, mwf)).toBe(3);
  });
});
