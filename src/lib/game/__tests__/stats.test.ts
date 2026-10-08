import { describe, expect, it } from "vitest";

import { CATEGORY_STAT, QUEST_CATEGORIES, statLevel, statProgress, statXpToReachLevel } from "../stats";
import { isStat } from "../types";

describe("statLevel", () => {
  it.each([
    [0, 0],
    [49, 0],
    [50, 1],
    [199, 1],
    [200, 2],
    [1250, 5],
    [5000, 10],
  ])("statLevel(%i) = %i", (xp, level) => {
    expect(statLevel(xp)).toBe(level);
  });

  it("round-trips with statXpToReachLevel", () => {
    for (let level = 0; level < 50; level++) {
      expect(statLevel(statXpToReachLevel(level))).toBe(level);
    }
  });
});

describe("statProgress", () => {
  it("measures progress toward the next stat level", () => {
    expect(statProgress(125)).toEqual({ level: 1, ratio: 0.5 });
    expect(statProgress(0)).toEqual({ level: 0, ratio: 0 });
  });
});

describe("CATEGORY_STAT", () => {
  it("maps every category to a valid stat", () => {
    for (const category of QUEST_CATEGORIES) expect(isStat(CATEGORY_STAT[category])).toBe(true);
  });
});
