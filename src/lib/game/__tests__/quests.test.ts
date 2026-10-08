import { describe, expect, it } from "vitest";

import {
  RETRY_DAYS,
  bossReadiness,
  effectiveStatus,
  questlineProgress,
  retryDeadline,
} from "../quests";

describe("effectiveStatus", () => {
  const today = "2026-10-08";
  it("derives expired from a past deadline only for active one-off quests", () => {
    expect(effectiveStatus({ status: "active", type: "boss", deadline: "2026-10-07" }, today)).toBe(
      "expired",
    );
    expect(effectiveStatus({ status: "active", type: "boss", deadline: "2026-10-08" }, today)).toBe(
      "active",
    );
    expect(effectiveStatus({ status: "active", type: "side", deadline: null }, today)).toBe(
      "active",
    );
    expect(
      effectiveStatus({ status: "completed", type: "boss", deadline: "2026-10-01" }, today),
    ).toBe("completed");
    expect(
      effectiveStatus({ status: "active", type: "daily", deadline: "2026-10-01" }, today),
    ).toBe("active");
  });
});

describe("questlineProgress", () => {
  it("weights by XP and ignores dailies and archived quests", () => {
    const progress = questlineProgress([
      { type: "main", status: "completed", xp: 40 },
      { type: "main", status: "active", xp: 120 },
      { type: "boss", status: "completed", xp: 300 },
      { type: "daily", status: "active", xp: 40 },
      { type: "main", status: "archived", xp: 200 },
    ]);
    expect(progress).toEqual({
      ratio: 340 / 460,
      completed: 2,
      total: 3,
      completedXp: 340,
      totalXp: 460,
    });
  });

  it("is zero for an empty questline", () => {
    expect(questlineProgress([]).ratio).toBe(0);
  });
});

describe("retryDeadline", () => {
  it("gives an expired quest a fresh week", () => {
    expect(retryDeadline("2026-10-08")).toBe("2026-10-15");
    expect(RETRY_DAYS).toBe(7);
  });
});

describe("bossReadiness", () => {
  it("is the XP share of finished prep steps, ignoring the boss and dailies", () => {
    expect(
      bossReadiness([
        { type: "main", status: "completed", xp: 70 },
        { type: "main", status: "active", xp: 70 },
        { type: "daily", status: "active", xp: 20 },
        { type: "boss", status: "active", xp: 500 },
      ]),
    ).toBe(0.5);
  });

  it("is null for a boss without prep", () => {
    expect(bossReadiness([{ type: "boss", status: "active", xp: 500 }])).toBeNull();
  });
});
