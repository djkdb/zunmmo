import { describe, expect, it } from "vitest";

import { describeRecurrence, occurrencesBetween } from "./recurrence";

describe("occurrencesBetween", () => {
  const classes = { startDate: "2026-10-05", weekdays: [1, 3], until: null, skip: [] }; // Mon & Wed

  it("returns a one-off schedule only inside the range", () => {
    const once = { startDate: "2026-10-09", weekdays: null, until: null, skip: [] };
    expect(occurrencesBetween(once, "2026-10-05", "2026-10-11")).toEqual(["2026-10-09"]);
    expect(occurrencesBetween(once, "2026-10-12", "2026-10-18")).toEqual([]);
  });

  it("repeats on the chosen weekdays from the first date on", () => {
    expect(occurrencesBetween(classes, "2026-10-01", "2026-10-18")).toEqual([
      "2026-10-05",
      "2026-10-07",
      "2026-10-12",
      "2026-10-14",
    ]);
  });

  it("stops at the end date and leaves skipped dates out", () => {
    const term = { ...classes, until: "2026-10-12", skip: ["2026-10-07"] };
    expect(occurrencesBetween(term, "2026-10-01", "2026-10-31")).toEqual([
      "2026-10-05",
      "2026-10-12",
    ]);
  });

  it("is empty when the series ended before the range", () => {
    expect(
      occurrencesBetween({ ...classes, until: "2026-10-07" }, "2026-10-12", "2026-10-18"),
    ).toEqual([]);
  });
});

describe("describeRecurrence", () => {
  it("reads like a timetable", () => {
    expect(describeRecurrence([3, 1], null)).toBe("매주 월·수");
    expect(describeRecurrence([1, 2, 3, 4, 5, 6, 7], null)).toBe("매일");
    expect(describeRecurrence([2], "2026-12-18")).toBe("매주 화 · 12월 18일까지");
  });
});
