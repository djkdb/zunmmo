import { describe, expect, it } from "vitest";

import { RepeatRuleSchema, describeRepeat, isDueOn, isoWeekStart } from "../repeat";

describe("repeat rules", () => {
  it("validates shapes", () => {
    expect(RepeatRuleSchema.safeParse({ freq: "daily" }).success).toBe(true);
    expect(RepeatRuleSchema.safeParse({ freq: "weekly", weekdays: [] }).success).toBe(false);
    expect(RepeatRuleSchema.safeParse({ freq: "weekly", weekdays: [8] }).success).toBe(false);
    expect(RepeatRuleSchema.safeParse({ freq: "weekly_count", timesPerWeek: 7 }).success).toBe(
      false,
    );
    expect(RepeatRuleSchema.safeParse({ freq: "hourly" }).success).toBe(false);
  });

  it("knows when a quest is due", () => {
    // 2026-10-08 is a Thursday (4)
    expect(isDueOn({ freq: "daily" }, "2026-10-08")).toBe(true);
    expect(isDueOn({ freq: "weekly", weekdays: [1, 3, 5] }, "2026-10-08")).toBe(false);
    expect(isDueOn({ freq: "weekly", weekdays: [4] }, "2026-10-08")).toBe(true);
    expect(isDueOn({ freq: "weekly_count", timesPerWeek: 3 }, "2026-10-08", 2)).toBe(true);
    expect(isDueOn({ freq: "weekly_count", timesPerWeek: 3 }, "2026-10-08", 3)).toBe(false);
  });

  it("finds the ISO week start", () => {
    expect(isoWeekStart("2026-10-08")).toBe("2026-10-05");
    expect(isoWeekStart("2026-10-05")).toBe("2026-10-05");
    expect(isoWeekStart("2026-10-11")).toBe("2026-10-05");
  });

  it("describes rules in Korean", () => {
    expect(describeRepeat({ freq: "daily" })).toBe("매일");
    expect(describeRepeat({ freq: "weekly", weekdays: [5, 1, 3] })).toBe("월·수·금");
    expect(describeRepeat({ freq: "weekly", weekdays: [1, 2, 3, 4, 5, 6, 7] })).toBe("매일");
    expect(describeRepeat({ freq: "weekly_count", timesPerWeek: 3 })).toBe("주 3회");
  });
});
