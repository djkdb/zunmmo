import { describe, expect, it } from "vitest";

import {
  type RecommendInput,
  type RecommendQuest,
  DEFAULT_MINUTES,
  MAX_PICKS,
  eligibleQuests,
  questMinutes,
  recommendToday,
  statNeglect,
  urgency,
} from "../recommend";

const TODAY = "2026-10-08"; // Thursday

let seq = 0;
function quest(overrides: Partial<RecommendQuest> = {}): RecommendQuest {
  seq += 1;
  return {
    id: `q${String(seq).padStart(3, "0")}`,
    type: "side",
    status: "active",
    difficulty: 2,
    xp: 40,
    primaryStat: "cre",
    deadline: null,
    repeat: null,
    goalId: null,
    estimatedMinutes: 30,
    createdAt: `2026-10-01T00:00:${String(seq % 60).padStart(2, "0")}Z`,
    ...overrides,
  };
}

const NO_STATS = { int: 0, foc: 0, vit: 0, soc: 0, cre: 0 };

function input(quests: RecommendQuest[], overrides: Partial<RecommendInput> = {}): RecommendInput {
  return {
    quests,
    completions: [],
    questlineProgress: {},
    statXpLast7Days: NO_STATS,
    scheduledMinutes: 0,
    capacityMinutes: 240,
    today: TODAY,
    ...overrides,
  };
}

describe("urgency", () => {
  it("peaks at D-0/D-1 and decays with distance", () => {
    expect(urgency(TODAY, TODAY)).toBe(1);
    expect(urgency("2026-10-09", TODAY)).toBe(1);
    expect(urgency("2026-10-10", TODAY)).toBe(0.5);
    expect(urgency("2026-10-12", TODAY)).toBe(0.25);
    expect(urgency(null, TODAY)).toBe(0);
  });

  it("keeps expired quests gently in play", () => {
    expect(urgency("2026-10-01", TODAY)).toBeCloseTo(0.3);
  });
});

describe("statNeglect", () => {
  it("is 0 with no recent growth and grows for quieter stats", () => {
    expect(statNeglect("soc", NO_STATS)).toBe(0);
    const week = { int: 200, foc: 100, vit: 0, soc: 0, cre: 50 };
    expect(statNeglect("int", week)).toBe(0);
    expect(statNeglect("foc", week)).toBe(0.5);
    expect(statNeglect("soc", week)).toBe(1);
  });
});

describe("questMinutes", () => {
  it("falls back to a difficulty default", () => {
    expect(questMinutes({ estimatedMinutes: null, difficulty: 4 })).toBe(DEFAULT_MINUTES[4]);
    expect(questMinutes({ estimatedMinutes: 45, difficulty: 4 })).toBe(45);
  });
});

describe("eligibleQuests", () => {
  it("keeps open quests and dailies due today that are not done yet", () => {
    const open = quest();
    const expired = quest({ status: "expired", deadline: "2026-10-01" });
    const done = quest({ status: "completed" });
    const archived = quest({ status: "archived" });
    const daily = quest({ type: "daily", repeat: { freq: "daily" } });
    const dailyDone = quest({ type: "daily", repeat: { freq: "daily" } });
    const weekendOnly = quest({ type: "daily", repeat: { freq: "weekly", weekdays: [6, 7] } });
    const twicePerWeek = quest({
      type: "daily",
      repeat: { freq: "weekly_count", timesPerWeek: 2 },
    });
    const ids = eligibleQuests({
      today: TODAY,
      quests: [open, expired, done, archived, daily, dailyDone, weekendOnly, twicePerWeek],
      completions: [
        { questId: dailyDone.id, occurrenceDate: TODAY },
        { questId: twicePerWeek.id, occurrenceDate: "2026-10-05" },
        { questId: twicePerWeek.id, occurrenceDate: "2026-10-06" },
      ],
    }).map((q) => q.id);
    expect(ids).toEqual([open.id, expired.id, daily.id]);
  });
});

describe("recommendToday", () => {
  it("is deterministic", () => {
    const quests = [
      quest(),
      quest({ deadline: "2026-10-10" }),
      quest({ type: "daily", repeat: { freq: "daily" } }),
    ];
    expect(recommendToday(input(quests))).toEqual(recommendToday(input([...quests].reverse())));
  });

  it("ranks urgent deadlines and today's dailies above open side quests", () => {
    const side = quest();
    const urgent = quest({ deadline: "2026-10-09" });
    const daily = quest({ type: "daily", repeat: { freq: "daily" } });
    const { picks } = recommendToday(input([side, urgent, daily]));
    expect(picks.map((p) => p.questId)).toEqual([urgent.id, daily.id, side.id]);
    expect(picks.map((p) => p.reason)).toEqual(["deadline", "daily", "open"]);
  });

  it("fits picks into the capacity left after schedules", () => {
    const quests = [
      quest({ estimatedMinutes: 90, deadline: "2026-10-09" }),
      quest({ estimatedMinutes: 90, deadline: "2026-10-10" }),
      quest({ estimatedMinutes: 60 }),
      quest({ estimatedMinutes: 30 }),
    ];
    const result = recommendToday(input(quests, { capacityMinutes: 240, scheduledMinutes: 120 }));
    expect(result.capacity).toBe(120);
    expect(result.totalMinutes).toBeLessThanOrEqual(120);
    expect(result.picks.map((p) => p.questId)).toEqual([quests[0]!.id, quests[3]!.id]);
  });

  it("always includes bosses due today or tomorrow, even over capacity", () => {
    const boss = quest({
      type: "boss",
      difficulty: 5,
      xp: 500,
      estimatedMinutes: 300,
      deadline: "2026-10-09",
    });
    const farBoss = quest({ type: "boss", estimatedMinutes: 300, deadline: "2026-10-20" });
    const result = recommendToday(input([quest(), boss, farBoss], { capacityMinutes: 60 }));
    expect(result.picks[0]!.questId).toBe(boss.id);
    expect(result.picks[0]!.reason).toBe("boss");
    expect(result.picks.map((p) => p.questId)).not.toContain(farBoss.id);
  });

  it("caps the list at six and never returns nothing when something is open", () => {
    const many = Array.from({ length: 10 }, () => quest({ estimatedMinutes: 5 }));
    expect(recommendToday(input(many)).picks).toHaveLength(MAX_PICKS);
    const huge = quest({ estimatedMinutes: 600 });
    expect(
      recommendToday(input([huge], { capacityMinutes: 60 })).picks.map((p) => p.questId),
    ).toEqual([huge.id]);
    expect(recommendToday(input([])).picks).toEqual([]);
  });

  it("prefers the next step of a progressing questline", () => {
    const first = quest({
      type: "main",
      goalId: "g1",
      primaryStat: "foc",
      createdAt: "2026-09-01T00:00:00Z",
    });
    const later = quest({
      type: "main",
      goalId: "g1",
      primaryStat: "foc",
      createdAt: "2026-09-02T00:00:00Z",
    });
    const side = quest({ primaryStat: "foc" });
    const { candidates } = recommendToday(
      input([later, side, first], { questlineProgress: { g1: 0.6 } }),
    );
    expect(candidates[0]).toMatchObject({ questId: first.id, reason: "questline" });
    expect(candidates.find((c) => c.questId === later.id)!.score).toBe(
      candidates.find((c) => c.questId === side.id)!.score,
    );
  });

  it("nudges toward stats that have been quiet this week", () => {
    const study = quest({ primaryStat: "int" });
    const friends = quest({ primaryStat: "soc" });
    const { picks } = recommendToday(
      input([study, friends], { statXpLast7Days: { ...NO_STATS, int: 300 } }),
    );
    expect(picks[0]).toMatchObject({ questId: friends.id, reason: "balance" });
  });
});
