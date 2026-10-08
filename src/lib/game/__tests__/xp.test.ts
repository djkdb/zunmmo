import { describe, expect, it } from "vitest";

import { DIFFICULTIES, QUEST_TYPES } from "../types";
import { goalClearBonus, questXp } from "../xp";

describe("questXp", () => {
  it("matches the GAME_SYSTEM §1.2/§1.3 table for every type × difficulty", () => {
    const table = Object.fromEntries(
      QUEST_TYPES.map((type) => [type, DIFFICULTIES.map((d) => questXp(type, d))]),
    );
    expect(table).toEqual({
      main: [20, 40, 70, 120, 200],
      daily: [20, 40, 70, 120, 200],
      side: [20, 40, 70, 120, 200],
      boss: [50, 100, 175, 300, 500],
      hidden: [30, 60, 105, 180, 300],
    });
  });

  it("always returns an integer", () => {
    for (const type of QUEST_TYPES) {
      for (const d of DIFFICULTIES) expect(Number.isInteger(questXp(type, d))).toBe(true);
    }
  });
});

describe("goalClearBonus", () => {
  it("is 20% of the questline XP, clamped to [200, 1000]", () => {
    expect(goalClearBonus(0)).toBe(200);
    expect(goalClearBonus(999)).toBe(200);
    expect(goalClearBonus(2000)).toBe(400);
    expect(goalClearBonus(5000)).toBe(1000);
    expect(goalClearBonus(99999)).toBe(1000);
  });

  it("treats negative input as zero", () => {
    expect(goalClearBonus(-500)).toBe(200);
  });
});
