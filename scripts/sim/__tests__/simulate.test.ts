import { describe, expect, it } from "vitest";

import {
  GAP_MINUTES,
  LIGHT_PACE,
  MAX_PLAN_SIZE,
  RETRY_DAYS,
  SNOOZE_DAYS,
  SPLIT_XP_ALLOWANCE,
  addDays,
  daysBetween,
  isoWeekStart,
  questXp,
} from "../../../src/lib/game";
import { HYUNWOO, SIM_PERSONAS, SOYEON, TAEO } from "../personas";
import { type SimResult, rootId, simulate, summarize } from "../simulate";

const DAYS = 28;
const runs: SimResult[] = SIM_PERSONAS.flatMap((p) => [
  simulate(p, DAYS),
  simulate(p, DAYS, { engaged: true }),
]);
const label = (r: SimResult) => `${r.persona.name} · ${r.engaged ? "engaged" : "passive"}`;

describe.each(runs.map((r) => [label(r), r] as const))("4-week life: %s", (_name, run) => {
  it("is deterministic", () => {
    expect(summarize(simulate(run.persona, DAYS, { engaged: run.engaged }))).toEqual(
      summarize(run),
    );
  });

  it("plays plans the app allows", () => {
    for (const day of run.days) {
      expect(day.plan.length, day.date).toBeLessThanOrEqual(MAX_PLAN_SIZE);
      expect(new Set(day.plan).size, day.date).toBe(day.plan.length);
      if (!run.engaged) {
        expect(day.plan, day.date).toEqual(
          day.played ? day.recommendation.picks.map((p) => p.questId) : [],
        );
        expect(day.actions, day.date).toEqual([]);
      }
    }
  });

  it("splits within the XP allowance, keeping the parts together", () => {
    const ids = [...run.quests.keys()];
    for (const action of run.days.flatMap((d) => d.actions)) {
      if (action.kind !== "split") continue;
      const before = action.from!;
      const parts = action.detail!.split(",");
      const partXp = parts.reduce((sum, id) => {
        const q = run.quests.get(id)!;
        return sum + questXp(q.type, q.difficulty);
      }, 0);
      expect(partXp).toBeLessThanOrEqual(
        questXp(before.type, before.difficulty) * SPLIT_XP_ALLOWANCE,
      );
      const at = ids.indexOf(parts[0]!);
      expect(ids.slice(at, at + parts.length)).toEqual(parts);
      expect(parts.every((id) => rootId(id) === action.questId)).toBe(true);
    }
  });

  it("does not offer a removed quest again while it rests", () => {
    const lastDrop = new Map<string, number>();
    for (const day of run.days) {
      for (const action of day.actions) {
        if (action.kind !== "drop") continue;
        const previous = lastDrop.get(action.questId);
        if (previous !== undefined) {
          expect(day.day - previous, day.date).toBeGreaterThan(SNOOZE_DAYS);
        }
        lastDrop.set(action.questId, day.day);
      }
    }
  });

  it("retries only expired, non-boss quests for a fresh week", () => {
    for (const day of run.days) {
      for (const action of day.actions) {
        if (action.kind !== "retry") continue;
        const seen = run.days[day.day - 1]?.seen.find((q) => q.id === action.questId);
        expect(action.detail).toBe(addDays(day.date, RETRY_DAYS));
        expect(run.quests.get(action.questId)!.type).not.toBe("boss");
        if (seen) expect(seen.deadline! < day.date, day.date).toBe(true);
      }
    }
  });

  it("never takes XP away", () => {
    let previous = 0;
    for (const day of run.days) {
      expect(day.totalXp).toBeGreaterThanOrEqual(previous);
      previous = day.totalXp;
    }
  });

  it("only recommends quests that can be played that day", () => {
    for (const day of run.days) {
      const seen = new Map(day.seen.map((q) => [q.id, q]));
      for (const pick of day.recommendation.picks) {
        const q = seen.get(pick.questId)!;
        expect(q.status === "completed" || q.status === "archived", `${day.date} ${q.id}`).toBe(
          false,
        );
        // A missed boss is never today's quest.
        if (q.type === "boss") expect(q.status, `${day.date} ${q.id}`).toBe("active");
      }
    }
  });

  it("keeps weekly habits to their weekly count", () => {
    const done = new Map<string, number>();
    for (const day of run.days) {
      for (const id of day.completed) {
        const quest = run.quests.get(id)!;
        if (quest.repeat?.freq !== "weekly_count") continue;
        const key = `${id}:${isoWeekStart(day.date)}`;
        done.set(key, (done.get(key) ?? 0) + 1);
        expect(done.get(key)).toBeLessThanOrEqual(quest.repeat.timesPerWeek);
      }
    }
  });

  it("plans within the day's budget (bosses due soon and the gap allowance aside)", () => {
    for (const day of run.days) {
      const r = day.recommendation;
      const forced = r.picks.filter((p) => p.reason === "boss");
      const rest = r.picks.filter((p) => p.reason !== "boss");
      const restMinutes = rest.reduce((sum, p) => sum + p.minutes, 0);
      const forcedMinutes = forced.reduce((sum, p) => sum + p.minutes, 0);
      if (r.picks.length > 1) {
        expect(restMinutes, day.date).toBeLessThanOrEqual(
          Math.max(r.budget - forcedMinutes, GAP_MINUTES),
        );
      }
      if (r.pace !== "normal") {
        expect(r.picks.length - forced.length, day.date).toBeLessThanOrEqual(LIGHT_PACE.maxPicks);
      }
    }
  });

  it("lets the words and the plan agree on light days", () => {
    for (const day of run.days) {
      if (day.situation === "late_night") expect(day.recommendation.pace).toBe("night");
      if (day.situation === "comeback") expect(day.recommendation.pace).not.toBe("normal");
    }
  });

  it("does not fight a boss before its prep is done", () => {
    for (const day of run.days) {
      const seen = new Map(day.seen.map((q) => [q.id, q]));
      for (const pick of day.recommendation.picks) {
        const boss = seen.get(pick.questId)!;
        if (boss.type !== "boss" || !boss.goalId || !boss.deadline) continue;
        const openPrep = day.seen.some(
          (q) => q.goalId === boss.goalId && q.type === "main" && q.status !== "completed",
        );
        if (openPrep) expect(daysBetween(day.date, boss.deadline), day.date).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("what the tools change", () => {
  const pair = (persona: (typeof SIM_PERSONAS)[number]) => ({
    passive: summarize(simulate(persona, DAYS)),
    engaged: summarize(simulate(persona, DAYS, { engaged: true })),
  });

  it("splitting unblocks a questline stuck behind a step longer than the day", () => {
    const { passive, engaged } = pair(HYUNWOO);
    expect(passive.questlinesCleared).toEqual([]);
    expect(engaged.actions.split).toBeGreaterThan(0);
    expect(engaged.questlinesCleared.map((q) => q.goal)).toEqual(["launch"]);
  });

  it("retrying after a break turns open deadlines into late finishes, never XP lost", () => {
    for (const persona of [SOYEON, TAEO]) {
      const { passive, engaged } = pair(persona);
      if (engaged.actions.retry === 0) continue;
      expect(engaged.deadlines.open, persona.name).toBeLessThan(passive.deadlines.open);
    }
    const { passive, engaged } = pair(SOYEON);
    expect(engaged.actions.retry).toBeGreaterThan(0);
    expect(engaged.deadlines.late).toBeGreaterThan(passive.deadlines.late);
  });
});
