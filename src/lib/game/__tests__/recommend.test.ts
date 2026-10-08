import { describe, expect, it } from "vitest";

import {
  type RecommendInput,
  type RecommendQuest,
  DEFAULT_MINUTES,
  GAP_MINUTES,
  LIGHT_PACE,
  MAX_PICKS,
  MAX_PLAN_SIZE,
  adventurePace,
  isLateNight,
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

  it("orders same-batch questline steps by sortOrder", () => {
    const at = "2026-09-01T00:00:00Z";
    const second = quest({ type: "main", goalId: "g2", createdAt: at, sortOrder: 1 });
    const first = quest({ type: "main", goalId: "g2", createdAt: at, sortOrder: 0 });
    const { candidates } = recommendToday(input([second, first]));
    expect(candidates[0]).toMatchObject({ questId: first.id, reason: "questline" });
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

describe("adventurePace", () => {
  it("is night before 05:00, comeback after a 3-day gap, normal otherwise", () => {
    expect(adventurePace({ today: TODAY, localHour: 1, lastPlayedDate: "2026-10-07" })).toBe(
      "night",
    );
    expect(adventurePace({ today: TODAY, localHour: 1, lastPlayedDate: "2026-09-01" })).toBe(
      "night",
    );
    expect(adventurePace({ today: TODAY, localHour: 9, lastPlayedDate: "2026-10-05" })).toBe(
      "comeback",
    );
    expect(adventurePace({ today: TODAY, localHour: 9, lastPlayedDate: "2026-10-06" })).toBe(
      "normal",
    );
    expect(adventurePace({ today: TODAY, localHour: 9, lastPlayedDate: null })).toBe("normal");
  });
});

describe("persona-driven rules", () => {
  it("plans a light day at night or on a comeback (P1, P3)", () => {
    const quests = Array.from({ length: 5 }, () => quest({ estimatedMinutes: 20 }));
    for (const pace of ["night", "comeback"] as const) {
      const result = recommendToday(input(quests, { pace }));
      expect(result.picks).toHaveLength(LIGHT_PACE.maxPicks);
      expect(result.budget).toBe(LIGHT_PACE.budgetMinutes);
      expect(result.pace).toBe(pace);
    }
    expect(recommendToday(input(quests)).picks).toHaveLength(5);
  });

  it("prepares for a boss through its questline instead of fighting it early (P1)", () => {
    const study = quest({
      type: "main",
      goalId: "exam",
      primaryStat: "int",
      createdAt: "2026-09-01T00:00:00Z",
    });
    const later = quest({
      type: "main",
      goalId: "exam",
      primaryStat: "int",
      createdAt: "2026-09-02T00:00:00Z",
    });
    const exam = quest({ type: "boss", goalId: "exam", difficulty: 5, deadline: "2026-10-11" });
    const side = quest({ deadline: "2026-10-12" });
    const { candidates } = recommendToday(input([side, later, exam, study]));
    expect(candidates.map((c) => c.questId)).not.toContain(exam.id);
    expect(candidates[0]).toMatchObject({ questId: study.id, reason: "prep" });

    // The day before, the boss itself is on the list.
    const eve = recommendToday(input([study, exam], { today: "2026-10-10" }));
    expect(eve.picks.map((p) => p.questId)).toContain(exam.id);
  });

  it("drops bosses whose date has passed (P3)", () => {
    const missed = quest({ type: "boss", status: "expired", deadline: "2026-10-03" });
    const yoga = quest({ type: "daily", repeat: { freq: "daily" } });
    const { candidates } = recommendToday(input([missed, yoga]));
    expect(candidates.map((c) => c.questId)).toEqual([yoga.id]);
  });

  it("still fits short quests between back-to-back schedules (P4)", () => {
    const boss = quest({ type: "boss", estimatedMinutes: 180, deadline: "2026-10-09" });
    const invoice = quest({ estimatedMinutes: 15 });
    const sketch = quest({ type: "daily", repeat: { freq: "daily" }, estimatedMinutes: 15 });
    const essay = quest({ estimatedMinutes: 90 });
    const result = recommendToday(input([boss, invoice, sketch, essay], { scheduledMinutes: 270 }));
    expect(result.capacity).toBe(0);
    expect(result.picks.map((p) => p.questId).sort()).toEqual(
      [boss.id, invoice.id, sketch.id].sort(),
    );
    expect(result.totalMinutes).toBe(180 + 2 * 15);
    expect(GAP_MINUTES).toBeGreaterThanOrEqual(30);
  });

  it("keeps equal routines in the order they were made (P5)", () => {
    const morning = quest({
      type: "daily",
      repeat: { freq: "daily" },
      id: "zzz",
      createdAt: "2026-09-01T00:00:00Z",
    });
    const evening = quest({
      type: "daily",
      repeat: { freq: "daily" },
      id: "aaa",
      createdAt: "2026-09-02T00:00:00Z",
    });
    const { picks } = recommendToday(input([evening, morning]));
    expect(picks.map((p) => p.questId)).toEqual(["zzz", "aaa"]);
  });

  it("names a questline step that is too long for today (P2)", () => {
    const payments = quest({ type: "main", goalId: "launch", estimatedMinutes: 120 });
    const reading = quest({ type: "daily", repeat: { freq: "daily" }, estimatedMinutes: 20 });
    const movie = quest({ estimatedMinutes: 160 });
    const result = recommendToday(input([payments, reading, movie], { capacityMinutes: 90 }));
    expect(result.picks.map((p) => p.questId)).toEqual([reading.id]);
    expect(result.tooBig?.questId).toBe(payments.id);

    const onlyMovie = recommendToday(input([reading, movie], { capacityMinutes: 90 }));
    expect(onlyMovie.tooBig).toBeNull();
  });
});

describe("simulation-driven rules", () => {
  it("measures late night from the player's own day start", () => {
    expect(isLateNight(1, 4)).toBe(true);
    expect(isLateNight(3, 4)).toBe(true);
    expect(isLateNight(4, 4)).toBe(false);
    expect(isLateNight(23, 4)).toBe(false);
    // A night owl with a 07:00 day start is mid-day at 01:00 and winding down at 05:00.
    expect(isLateNight(1, 7)).toBe(false);
    expect(isLateNight(5, 7)).toBe(true);
    expect(
      adventurePace({ today: TODAY, localHour: 1, dayStartHour: 7, lastPlayedDate: null }),
    ).toBe("normal");
  });

  it("adds the day's habits on top of six one-off picks", () => {
    const habits = Array.from({ length: 8 }, (_, i) =>
      quest({
        type: "daily",
        repeat: { freq: "daily" },
        estimatedMinutes: 5,
        createdAt: `2026-09-01T00:00:0${i}Z`,
      }),
    );
    const sides = Array.from({ length: 8 }, () => quest({ estimatedMinutes: 10 }));
    const { picks } = recommendToday(input([...habits, ...sides]));
    expect(picks.filter((p) => habits.some((h) => h.id === p.questId))).toHaveLength(8);
    expect(picks).toHaveLength(MAX_PLAN_SIZE);
    const routinesOnly = recommendToday(input(habits));
    expect(routinesOnly.picks).toHaveLength(8);
  });
});
