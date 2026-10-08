import { describe, expect, it } from "vitest";

import { deadlineChips } from "./date-chips";

describe("deadlineChips", () => {
  it("offers today, tomorrow, Friday and next Monday without duplicates", () => {
    // Wednesday
    expect(deadlineChips("2026-10-07")).toEqual([
      { label: "오늘", date: "2026-10-07" },
      { label: "내일", date: "2026-10-08" },
      { label: "이번 주 금요일", date: "2026-10-09" },
      { label: "다음 주 월요일", date: "2026-10-12" },
    ]);
    // Thursday: tomorrow is Friday → one chip
    expect(deadlineChips("2026-10-08").map((c) => c.date)).toEqual([
      "2026-10-08",
      "2026-10-09",
      "2026-10-12",
    ]);
  });

  it("rolls Friday into next week on weekends", () => {
    expect(deadlineChips("2026-10-10")).toContainEqual({
      label: "다음 주 금요일",
      date: "2026-10-16",
    });
    // Sunday: tomorrow is already Monday, so only "내일" carries that date.
    expect(deadlineChips("2026-10-11").map((c) => c.label)).toEqual([
      "오늘",
      "내일",
      "다음 주 금요일",
    ]);
  });
});
