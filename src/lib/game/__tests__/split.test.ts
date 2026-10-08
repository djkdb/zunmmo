import { describe, expect, it } from "vitest";

import {
  isSplittable,
  splitDifficulty,
  splitMinutes,
  splitPlan,
  SPLIT_XP_ALLOWANCE,
} from "../split";
import { questXp } from "../xp";

describe("splitDifficulty", () => {
  it("keeps the parts' total XP within the original plus a small allowance", () => {
    expect(splitDifficulty("main", 4, 3)).toBe(2); // 120 → 3 × 40
    expect(splitDifficulty("main", 3, 2)).toBe(2); // 70 → 2 × 40 (≤ 84)
    expect(splitDifficulty("main", 5, 2)).toBe(4); // 200 → 2 × 120
    expect(splitDifficulty("side", 1, 4)).toBe(1); // never below ⭐1
    for (const d of [1, 2, 3, 4, 5] as const) {
      for (let n = 2; n <= 6; n++) {
        const part = splitDifficulty("main", d, n);
        expect(part).toBeLessThanOrEqual(d);
        if (part > 1)
          expect(questXp("main", part) * n).toBeLessThanOrEqual(
            questXp("main", d) * SPLIT_XP_ALLOWANCE,
          );
      }
    }
  });
});

describe("splitMinutes", () => {
  it("shares the estimate in 5-minute steps", () => {
    expect(splitMinutes(120, 3)).toBe(40);
    expect(splitMinutes(90, 4)).toBe(25);
    expect(splitMinutes(10, 6)).toBe(5);
    expect(splitMinutes(null, 3)).toBeNull();
  });
});

describe("splitPlan", () => {
  it("turns titles into parts with XP from questXp", () => {
    const parts = splitPlan({ type: "main", difficulty: 4, estimatedMinutes: 120 }, [
      "설계",
      "구현",
      "테스트",
    ]);
    expect(parts).toEqual([
      { title: "설계", difficulty: 2, xp: 40, estimatedMinutes: 40 },
      { title: "구현", difficulty: 2, xp: 40, estimatedMinutes: 40 },
      { title: "테스트", difficulty: 2, xp: 40, estimatedMinutes: 40 },
    ]);
  });

  it("only splits main and side quests", () => {
    expect(isSplittable("main")).toBe(true);
    expect(isSplittable("side")).toBe(true);
    expect(isSplittable("boss")).toBe(false);
    expect(isSplittable("daily")).toBe(false);
  });
});
