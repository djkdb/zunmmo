import { describe, expect, it } from "vitest";

import type { QuestView } from "@/features/quests/queries";

import { dayItems, dayMarkers, describeDay, monthGrid, shiftMonth, weekDates } from "./model";
import type { ScheduleView } from "./queries";

const quest = (o: Partial<QuestView>): QuestView => ({
  id: o.id ?? "q",
  title: "퀘스트",
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

const schedule = (o: Partial<ScheduleView>): ScheduleView => ({
  id: "s",
  title: "축구 경기",
  date: "2026-10-10",
  startTime: "15:00",
  endTime: "17:00",
  allDay: false,
  location: null,
  quest: null,
  minutes: 120,
  repeat: null,
  changed: null,
  ...o,
  key: `${o.id ?? "s"}:${o.date ?? "2026-10-10"}`,
});

describe("calendar grids", () => {
  it("lists Monday to Sunday", () => {
    expect(weekDates("2026-10-08")).toEqual([
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
      "2026-10-11",
    ]);
  });

  it("covers the whole month in Monday-first weeks", () => {
    const grid = monthGrid("2026-10-08");
    expect(grid).toHaveLength(5);
    expect(grid[0]![0]).toEqual({ date: "2026-09-28", inMonth: false });
    expect(grid[0]![3]).toEqual({ date: "2026-10-01", inMonth: true });
    expect(grid.at(-1)!.at(-1)).toEqual({ date: "2026-11-01", inMonth: false });
    expect(grid.flat().filter((d) => d.inMonth)).toHaveLength(31);
  });

  it("shifts months and clamps the day", () => {
    expect(shiftMonth("2026-01-31", 1)).toBe("2026-02-28");
    expect(shiftMonth("2026-10-08", -1)).toBe("2026-09-08");
    expect(shiftMonth("2026-12-15", 1)).toBe("2027-01-15");
  });
});

describe("dayItems", () => {
  const boss = quest({ id: "boss", type: "boss", deadline: "2026-10-10" });
  const side = quest({ id: "side", deadline: "2026-10-10" });
  const done = quest({ id: "done", deadline: "2026-10-10", status: "completed" });
  const daily = quest({ id: "daily", type: "daily", repeat: { freq: "weekly", weekdays: [6] } });
  const archived = quest({ id: "arch", deadline: "2026-10-10", status: "archived" });
  const data = {
    quests: [side, boss, done, daily, archived],
    schedules: [schedule({}), schedule({ id: "other", date: "2026-10-11" })],
    completions: [{ questId: "done", occurrenceDate: "2026-10-10" }],
  };

  it("collects deadlines, due dailies, schedules and completions for a day", () => {
    const items = dayItems("2026-10-10", "2026-10-08", data);
    expect(items.deadlines.map((q) => q.id)).toEqual(["side", "boss"]);
    expect(items.dailies.map((q) => q.id)).toEqual(["daily"]);
    expect(items.schedules.map((s) => s.id)).toEqual(["s"]);
    expect(items.completed.map((q) => q.id)).toEqual(["done"]);
  });

  it("does not project dailies into the past", () => {
    expect(dayItems("2026-10-03", "2026-10-08", data).dailies).toEqual([]);
  });

  it("summarizes a day as markers and words", () => {
    const items = dayItems("2026-10-10", "2026-10-08", data);
    expect(dayMarkers(items)).toEqual({ markers: ["boss", "side", "schedule"], extra: 1 });
    expect(describeDay(items)).toBe("마감 2개, 일정 1개, 완료 1개");
  });
});
