import { describe, expect, it } from "vitest";

import {
  type LevelCurve,
  MAX_LEVEL,
  detectLevelUp,
  levelFromXp,
  levelProgress,
  xpToReachLevel,
} from "../level";

const LINEAR: LevelCurve = { kind: "linear", step: 1000 };

describe("ramp curve (default since the 4-week simulation)", () => {
  it("makes early levels cheap and settles at 1,000 per level", () => {
    expect(xpToReachLevel(1)).toBe(0);
    expect(xpToReachLevel(2)).toBe(300);
    expect(xpToReachLevel(3)).toBe(700);
    expect(xpToReachLevel(5)).toBe(1800);
    expect(xpToReachLevel(9)).toBe(5200);
    expect(xpToReachLevel(10)).toBe(6200);
    expect(xpToReachLevel(11) - xpToReachLevel(10)).toBe(1000);
  });

  it("never asks more XP than the linear curve for any level", () => {
    for (let level = 1; level <= MAX_LEVEL; level++) {
      expect(xpToReachLevel(level)).toBeLessThanOrEqual(xpToReachLevel(level, LINEAR));
    }
  });

  it("round-trips every level boundary", () => {
    for (let level = 1; level < MAX_LEVEL; level++) {
      expect(levelFromXp(xpToReachLevel(level))).toBe(level);
      expect(levelFromXp(xpToReachLevel(level + 1) - 1)).toBe(level);
    }
  });
});

describe("linear curve", () => {
  it("requires 1,000 XP per level", () => {
    expect(xpToReachLevel(1, LINEAR)).toBe(0);
    expect(xpToReachLevel(2, LINEAR)).toBe(1000);
    expect(xpToReachLevel(24, LINEAR)).toBe(23_000);
  });

  it.each([
    [0, 1],
    [999, 1],
    [1000, 2],
    [1001, 2],
    [23_420, 24],
  ])("levelFromXp(%i) = %i", (xp, level) => {
    expect(levelFromXp(xp, LINEAR)).toBe(level);
  });

  it("caps at MAX_LEVEL", () => {
    expect(levelFromXp(10_000_000)).toBe(MAX_LEVEL);
    expect(xpToReachLevel(MAX_LEVEL + 10)).toBe(xpToReachLevel(MAX_LEVEL));
  });

  it("is defensive against negative, fractional and non-finite XP", () => {
    expect(levelFromXp(-50)).toBe(1);
    expect(levelFromXp(Number.NaN)).toBe(1);
    expect(levelFromXp(1999.9, LINEAR)).toBe(2);
  });
});

describe("levelProgress", () => {
  it("reports progress inside the current level", () => {
    expect(levelProgress(23_420, LINEAR)).toEqual({
      level: 24,
      xpIntoLevel: 420,
      xpForNextLevel: 1000,
      ratio: 0.42,
      isMaxLevel: false,
    });
  });

  it("starts at zero", () => {
    expect(levelProgress(0)).toMatchObject({ level: 1, xpIntoLevel: 0, ratio: 0 });
  });

  it("is full at max level", () => {
    expect(levelProgress(10_000_000)).toMatchObject({
      level: MAX_LEVEL,
      xpForNextLevel: 0,
      ratio: 1,
      isMaxLevel: true,
    });
  });
});

describe("detectLevelUp", () => {
  it("returns null when the level does not change", () => {
    expect(detectLevelUp(100, 250)).toBeNull();
  });

  it("detects single and multi level jumps", () => {
    expect(detectLevelUp(900, 1000, LINEAR)).toEqual({ from: 1, to: 2 });
    expect(detectLevelUp(250, 1300)).toEqual({ from: 1, to: 4 });
    expect(detectLevelUp(900, 3500, LINEAR)).toEqual({ from: 1, to: 4 });
  });

  it("never reports a level down (undo is silent)", () => {
    expect(detectLevelUp(1000, 900)).toBeNull();
  });
});

describe("polynomial curve (swappable)", () => {
  const curve: LevelCurve = { kind: "polynomial", base: 500, exponent: 1.5 };

  it("grows faster than linear and stays consistent with levelFromXp", () => {
    expect(xpToReachLevel(2, curve)).toBe(500);
    expect(xpToReachLevel(5, curve)).toBe(4000);
    for (let level = 1; level < 30; level++) {
      expect(levelFromXp(xpToReachLevel(level, curve), curve)).toBe(level);
      expect(levelFromXp(xpToReachLevel(level + 1, curve) - 1, curve)).toBe(level);
    }
  });
});
