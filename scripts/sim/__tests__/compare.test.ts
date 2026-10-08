import { describe, expect, it } from "vitest";

import { levelFromXp, xpToReachLevel } from "../../../src/lib/game";
import {
  MIN_BETA_PLAYERS,
  compareBeta,
  comparisonMarkdown,
  parseBetaMetrics,
  simFigures,
} from "../compare";
import { SIM_PERSONAS } from "../personas";
import { simulate } from "../simulate";

const runs = SIM_PERSONAS.flatMap((p) => [simulate(p, 28), simulate(p, 28, { engaged: true })]);
const figures = runs.map(simFigures);
const range = (pick: (f: (typeof figures)[number]) => number) => ({
  min: Math.min(...figures.map(pick)),
  max: Math.max(...figures.map(pick)),
});

const BETA = {
  players_week1: 24,
  week1_xp_p25: 120,
  week1_xp_p50: 200,
  week1_xp_p75: 420,
  players_month1: 12,
  month1_xp_p50: 1400,
  active_days_p50: 14,
  plans: 300,
  plan_size_avg: 3.1,
  done_rate_pct: 71.5,
  removed_per_plan_avg: 0.4,
};

describe("beta vs simulation", () => {
  it("reads the query's json, wrapped or bare, numbers as strings too", () => {
    expect(parseBetaMetrics({ beta: BETA }).plans).toBe(300);
    expect(parseBetaMetrics({ ...BETA, plan_size_avg: "3.10" }).plan_size_avg).toBe(3.1);
    expect(parseBetaMetrics({ ...BETA, week1_xp_p50: null }).week1_xp_p50).toBeNull();
    expect(() => parseBetaMetrics({ plans: 1 })).toThrow();
  });

  it("measures the simulated lives the way the query measures players", () => {
    for (const f of figures) {
      expect(f.week1LevelUps).toBe(levelFromXp(f.week1Xp) - 1);
      expect(f.activeDays).toBeLessThanOrEqual(28);
      expect(f.doneRate).toBeGreaterThanOrEqual(0);
      expect(f.doneRate).toBeLessThanOrEqual(100);
    }
  });

  it("flags beta outside the simulated range with where to look first", () => {
    const week1 = range((f) => f.week1Xp);
    const slow = compareBeta(parseBetaMetrics({ ...BETA, week1_xp_p50: week1.min - 50 }), runs);
    const row = slow.find((r) => r.metric.startsWith("1주차 XP"))!;
    expect(row.verdict).toBe("below");
    expect(row.hint).toMatch(/LEVEL_CURVE/);

    const inside = compareBeta(
      parseBetaMetrics({ ...BETA, week1_xp_p50: (week1.min + week1.max) / 2 }),
      runs,
    );
    expect(inside.find((r) => r.metric.startsWith("1주차 XP"))!).toMatchObject({
      verdict: "within",
      hint: null,
    });
  });

  it("derives the median player's week-one level-ups from the curve", () => {
    const rows = compareBeta(parseBetaMetrics({ ...BETA, week1_xp_p50: xpToReachLevel(3) }), runs);
    expect(rows.find((r) => r.metric.startsWith("1주차 레벨업"))!.beta).toBe(2);
  });

  it("marks missing data and warns about small samples", () => {
    const rows = compareBeta(parseBetaMetrics({ ...BETA, month1_xp_p50: null }), runs);
    expect(rows.find((r) => r.metric.startsWith("4주 XP"))!.verdict).toBe("no-data");
    const small = parseBetaMetrics({ ...BETA, players_week1: MIN_BETA_PLAYERS - 1 });
    expect(comparisonMarkdown(small, rows)).toMatch(/표본을 더 모으세요/);
    expect(comparisonMarkdown(parseBetaMetrics(BETA), rows)).not.toMatch(/표본을 더 모으세요/);
  });
});
