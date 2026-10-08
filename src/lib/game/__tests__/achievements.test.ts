import { describe, expect, it } from "vitest";

import { ACHIEVEMENTS, type ProgressSnapshot, isAchieved, newlyUnlocked } from "../achievements";
import { statXpToReachLevel } from "../stats";

const empty: ProgressSnapshot = {
  completions: 0,
  byType: {},
  goalsCleared: 0,
  earlyBird: 0,
  totalXp: 0,
  statXp: { int: 0, foc: 0, vit: 0, soc: 0, cre: 0 },
  adventureStreak: 0,
};

describe("achievements", () => {
  it("has unique snake_case ids that fit the DB check", () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9_]{1,40}$/);
  });

  it("unlocks nothing for a fresh player", () => {
    expect(newlyUnlocked(empty, new Set())).toEqual([]);
  });

  it("unlocks the first step and first boss together", () => {
    const p = { ...empty, completions: 1, byType: { boss: 1 }, totalXp: 500 };
    expect(newlyUnlocked(p, new Set()).map((a) => a.id)).toEqual(["first_step", "boss_slayer_1"]);
    expect(newlyUnlocked(p, new Set(["first_step"])).map((a) => a.id)).toEqual(["boss_slayer_1"]);
  });

  it("evaluates each criteria kind", () => {
    expect(isAchieved({ kind: "level_reached", level: 5 }, { ...empty, totalXp: 4000 })).toBe(true);
    expect(isAchieved({ kind: "level_reached", level: 5 }, { ...empty, totalXp: 3999 })).toBe(
      false,
    );
    expect(isAchieved({ kind: "goal_cleared", count: 1 }, { ...empty, goalsCleared: 1 })).toBe(
      true,
    );
    expect(
      isAchieved({ kind: "adventure_streak", days: 7 }, { ...empty, adventureStreak: 7 }),
    ).toBe(true);
    expect(isAchieved({ kind: "early_bird", count: 10 }, { ...empty, earlyBird: 9 })).toBe(false);
    const lv5 = statXpToReachLevel(5);
    expect(
      isAchieved(
        { kind: "all_stats_level", level: 5 },
        { ...empty, statXp: { int: lv5, foc: lv5, vit: lv5, soc: lv5, cre: lv5 - 1 } },
      ),
    ).toBe(false);
    expect(
      isAchieved(
        { kind: "all_stats_level", level: 5 },
        { ...empty, statXp: { int: lv5, foc: lv5, vit: lv5, soc: lv5, cre: lv5 } },
      ),
    ).toBe(true);
  });
});
