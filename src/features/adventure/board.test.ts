import { describe, expect, it } from "vitest";

import type { QuestView, QuestlineView } from "@/features/quests/queries";

import { selectBoard } from "./board";

const quest = (overrides: Partial<QuestView>): QuestView => ({
  id: crypto.randomUUID(),
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
  ...overrides,
});

const today = "2026-10-08"; // Thursday

describe("selectBoard", () => {
  it("shows only the nearest boss within a week", () => {
    const far = quest({ type: "boss", deadline: "2026-10-20" });
    const near = quest({ type: "boss", deadline: "2026-10-12" });
    const nearer = quest({ type: "boss", deadline: "2026-10-09" });
    expect(selectBoard([far, near, nearer], [], today).boss?.id).toBe(nearer.id);
    expect(selectBoard([far], [], today).boss).toBeNull();
  });

  it("keeps dailies due today and those already done today", () => {
    const everyday = quest({ type: "daily", repeat: { freq: "daily" } });
    const mondays = quest({ type: "daily", repeat: { freq: "weekly", weekdays: [1] } });
    const thrice = quest({ type: "daily", repeat: { freq: "weekly_count", timesPerWeek: 2 } });
    const board = selectBoard([everyday, mondays, thrice], [], today, [
      { questId: everyday.id, occurrenceDate: today },
      { questId: thrice.id, occurrenceDate: "2026-10-05" },
      { questId: thrice.id, occurrenceDate: "2026-10-06" },
    ]);
    expect(board.dailies).toEqual([{ quest: everyday, doneToday: true }]);
  });

  it("caps side quests and questlines, ignores inactive ones", () => {
    const sides = [1, 2, 3, 4].map(() => quest({ type: "side" }));
    const done = quest({ type: "side", status: "completed" });
    const line = (status: QuestlineView["status"]): QuestlineView => ({
      id: crypto.randomUUID(),
      title: "line",
      description: null,
      targetDate: null,
      status,
      steps: [],
      progress: { ratio: 0, completed: 0, total: 0, completedXp: 0, totalXp: 0 },
    });
    const board = selectBoard(
      [...sides, done],
      [line("active"), line("cleared"), line("active"), line("active")],
      today,
    );
    expect(board.sides).toHaveLength(3);
    expect(board.sides).not.toContain(done);
    expect(board.questlines).toHaveLength(2);
    expect(board.isEmpty).toBe(false);
    expect(selectBoard([], [], today).isEmpty).toBe(true);
  });
});
