import { describe, expect, it } from "vitest";

import { GAP_MINUTES, LIGHT_PACE, daysBetween, isoWeekStart } from "../../../src/lib/game";
import { SIM_PERSONAS } from "../personas";
import { type SimResult, simulate, summarize } from "../simulate";

const DAYS = 28;
const runs: SimResult[] = SIM_PERSONAS.map((p) => simulate(p, DAYS));

describe.each(runs.map((r) => [r.persona.name, r] as const))("4-week life: %s", (_name, run) => {
  it("is deterministic", () => {
    expect(summarize(simulate(run.persona, DAYS))).toEqual(summarize(run));
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
