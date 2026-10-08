import { describe, expect, it } from "vitest";

import type { QuestView } from "@/features/quests/queries";

import { adventureMood } from "./mood";

const quest = (o: Partial<QuestView>): QuestView => ({
  id: "q",
  title: "q",
  description: null,
  type: "side",
  difficulty: 2,
  xp: 40,
  primaryStat: "cre",
  status: "active",
  deadline: null,
  scheduledFor: null,
  estimatedMinutes: null,
  repeat: null,
  goal: null,
  completedAt: null,
  createdAt: "2026-10-01T00:00:00Z",
  sortOrder: 0,
  ...o,
});

describe("adventureMood", () => {
  const today = "2026-10-08";
  it("acts out the next step's stat", () => {
    expect(adventureMood(quest({ primaryStat: "int" }), today)).toBe("studying");
    expect(adventureMood(quest({ primaryStat: "foc" }), today)).toBe("working");
    expect(adventureMood(quest({ primaryStat: "vit" }), today)).toBe("exercising");
    expect(adventureMood(quest({ primaryStat: "soc" }), today)).toBe("walking");
    expect(adventureMood(undefined, today)).toBe("walking");
  });

  it("runs toward a boss due today or tomorrow", () => {
    expect(
      adventureMood(quest({ type: "boss", primaryStat: "int", deadline: "2026-10-09" }), today),
    ).toBe("running");
    expect(
      adventureMood(quest({ type: "boss", primaryStat: "int", deadline: "2026-10-12" }), today),
    ).toBe("studying");
  });
});
