import { describe, expect, it } from "vitest";

import { fromLocal, minutesBetween, toLocal } from "./zoned";

describe("zoned time", () => {
  it("round-trips a Seoul wall time", () => {
    const at = fromLocal("2026-10-10", "15:00", "Asia/Seoul");
    expect(at.toISOString()).toBe("2026-10-10T06:00:00.000Z");
    expect(toLocal(at, "Asia/Seoul")).toEqual({ date: "2026-10-10", time: "15:00" });
  });

  it("crosses the date line correctly", () => {
    const at = fromLocal("2026-10-10", "01:30", "Asia/Seoul");
    expect(at.toISOString()).toBe("2026-10-09T16:30:00.000Z");
  });

  it("handles a DST zone on both sides of the change", () => {
    expect(fromLocal("2026-07-01", "09:00", "America/New_York").toISOString()).toBe(
      "2026-07-01T13:00:00.000Z",
    );
    expect(fromLocal("2026-12-01", "09:00", "America/New_York").toISOString()).toBe(
      "2026-12-01T14:00:00.000Z",
    );
  });

  it("measures durations", () => {
    expect(minutesBetween(new Date("2026-10-10T06:00Z"), new Date("2026-10-10T07:30Z"))).toBe(90);
    expect(minutesBetween(new Date("2026-10-10T07:00Z"), new Date("2026-10-10T06:00Z"))).toBe(0);
  });
});
