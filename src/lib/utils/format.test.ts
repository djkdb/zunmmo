import { describe, expect, it } from "vitest";

import { formatMinutes, formatNumber, formatXpGain, formatGameDate } from "./format";

describe("format", () => {
  it("formats numbers with thousands separators", () => {
    expect(formatNumber(23420)).toBe("23,420");
  });

  it("always signs XP", () => {
    expect(formatXpGain(70)).toBe("+70 XP");
    expect(formatXpGain(1500)).toBe("+1,500 XP");
    expect(formatXpGain(-70)).toBe("−70 XP");
  });

  it("formats durations in Korean", () => {
    expect(formatMinutes(30)).toBe("30분");
    expect(formatMinutes(60)).toBe("1시간");
    expect(formatMinutes(95)).toBe("1시간 35분");
  });
});

describe("formatGameDate", () => {
  it("reads month and day without leading zeros", () => {
    expect(formatGameDate("2026-10-08")).toBe("10월 8일");
    expect(formatGameDate("2027-01-31")).toBe("1월 31일");
  });
});
