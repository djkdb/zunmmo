import { describe, expect, it } from "vitest";

import { type BriefingInput, allBriefingLines, briefing } from "../briefing";

const base: BriefingInput = {
  today: "2026-10-08",
  localHour: 9,
  completedToday: 0,
  boss: null,
  adventureStreak: 0,
  lastPlayedDate: "2026-10-07",
  totalMinutes: 180,
  pickCount: 4,
};

describe("briefing", () => {
  it("picks situations by priority", () => {
    const situation = (o: Partial<BriefingInput>) => briefing({ ...base, ...o }).situation;
    expect(situation({ localHour: 2 })).toBe("late_night");
    expect(situation({ localHour: 2, completedToday: 1 })).not.toBe("late_night");
    expect(
      situation({ boss: { title: "중간고사", deadline: "2026-10-08" }, adventureStreak: 9 }),
    ).toBe("boss_today");
    expect(situation({ boss: { title: "중간고사", deadline: "2026-10-11" } })).toBe("boss_soon");
    expect(situation({ boss: { title: "중간고사", deadline: "2026-10-20" } })).toBe("default");
    expect(situation({ adventureStreak: 3 })).toBe("streak");
    expect(situation({ lastPlayedDate: "2026-10-05" })).toBe("comeback");
    expect(situation({ lastPlayedDate: null })).toBe("default");
    expect(situation({ totalMinutes: 45 })).toBe("light_day");
    expect(situation({})).toBe("default");
  });

  it("fills names and counts into the line", () => {
    expect(
      briefing({ ...base, boss: { title: "AI 중간고사", deadline: "2026-10-10" } }).line,
    ).toContain("AI 중간고사");
    expect(briefing({ ...base, adventureStreak: 5 }).line).toContain("5일");
  });

  it("says the same thing all day and can change the next day", () => {
    const a = briefing(base).line;
    expect(briefing({ ...base, localHour: 22 }).line).toBe(a);
    const week = Array.from(
      { length: 7 },
      (_, i) => briefing({ ...base, today: `2026-10-${String(8 + i).padStart(2, "0")}` }).line,
    );
    expect(new Set(week).size).toBeGreaterThan(1);
  });

  it("asks for a matching character mood", () => {
    expect(briefing({ ...base, localHour: 1 }).mood).toBe("sleeping");
    expect(briefing({ ...base, adventureStreak: 7 }).mood).toBe("celebrating");
  });

  it("never judges the player", () => {
    for (const line of allBriefingLines()) {
      expect(line).not.toMatch(/실패|패배|게으|왜 안|못했|벌칙|손해/);
    }
  });
});
