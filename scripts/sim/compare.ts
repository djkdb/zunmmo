/**
 * Beta data vs the four-week simulation (docs/DEPLOY.md §5, docs/PERSONAS.md §7).
 * `supabase/queries/beta-metrics.sql` query 7 exports one aggregated JSON row; this compares
 * it with the range the simulated personas cover and says which rule to look at first.
 * Levels come from lib/game, so the curve lives in one place.
 */
import { z } from "zod";

import { levelFromXp } from "../../src/lib/game";
import type { SimResult } from "./simulate";

/** Below this many players a percentile is an anecdote — the report says so. */
export const MIN_BETA_PLAYERS = 10;

const num = z.coerce.number().finite();
const maybe = num.nullable();

export const BetaMetricsSchema = z.object({
  players_week1: num,
  week1_xp_p25: maybe,
  week1_xp_p50: maybe,
  week1_xp_p75: maybe,
  players_month1: num,
  month1_xp_p50: maybe,
  active_days_p50: maybe,
  plans: num,
  plan_size_avg: maybe,
  done_rate_pct: maybe,
  removed_per_plan_avg: maybe,
});
export type BetaMetrics = z.infer<typeof BetaMetricsSchema>;

/** The `beta` column of query 7 may arrive wrapped (`{ "beta": {…} }`) or bare. */
export function parseBetaMetrics(json: unknown): BetaMetrics {
  const value =
    json && typeof json === "object" && "beta" in json ? (json as { beta: unknown }).beta : json;
  return BetaMetricsSchema.parse(value);
}

export interface SimFigures {
  week1Xp: number;
  week1LevelUps: number;
  month1Xp: number;
  activeDays: number;
  planSize: number;
  doneRate: number;
  removedPerPlan: number;
}

/** The same figures the query measures, from one simulated life. */
export function simFigures(run: SimResult): SimFigures {
  const days = run.days;
  const week1Xp = days.slice(0, 7).reduce((sum, d) => sum + d.xpGained, 0);
  const plans = days.filter((d) => d.plan.length > 0);
  const planned = plans.reduce((n, d) => n + d.plan.length, 0);
  const done = plans.reduce((n, d) => n + d.completed.length, 0);
  const removed = plans.reduce((n, d) => n + d.actions.filter((a) => a.kind === "drop").length, 0);
  return {
    week1Xp,
    week1LevelUps: levelFromXp(week1Xp) - 1,
    month1Xp: days.slice(0, 28).reduce((sum, d) => sum + d.xpGained, 0),
    activeDays: days.slice(0, 28).filter((d) => d.completed.length > 0).length,
    planSize: plans.length ? planned / plans.length : 0,
    doneRate: planned ? (100 * done) / planned : 0,
    removedPerPlan: plans.length ? removed / plans.length : 0,
  };
}

export type Verdict = "below" | "within" | "above" | "no-data";

export interface ComparisonRow {
  metric: string;
  beta: number | null;
  simMin: number;
  simMax: number;
  verdict: Verdict;
  /** What to look at first when beta falls outside the simulated range. */
  hint: string | null;
}

interface MetricSpec {
  metric: string;
  beta: (b: BetaMetrics) => number | null;
  sim: (f: SimFigures) => number;
  below: string;
  above: string;
}

const METRICS: readonly MetricSpec[] = [
  {
    metric: "1주차 XP (중앙값)",
    beta: (b) => b.week1_xp_p50,
    sim: (f) => f.week1Xp,
    below: "초반이 느려요: LEVEL_CURVE의 first/increment, 첫 템플릿 퀘스트의 난이도",
    above: "초반 XP가 시뮬보다 많아요: 습관 XP(questXp daily)·업적 보너스 확인",
  },
  {
    metric: "1주차 레벨업 (중앙값 플레이어)",
    beta: (b) => (b.week1_xp_p50 === null ? null : levelFromXp(b.week1_xp_p50) - 1),
    sim: (f) => f.week1LevelUps,
    below: "목표 '첫 주 1–2회'에 못 미쳐요: LEVEL_CURVE 초반 단계를 낮추기",
    above: "레벨이 너무 빨라요: LEVEL_CURVE increment를 올리기",
  },
  {
    metric: "4주 XP (중앙값)",
    beta: (b) => b.month1_xp_p50,
    sim: (f) => f.month1Xp,
    below: "4주차까지 성장이 더뎌요: 활동일·하루 완료 수부터 확인",
    above: "4주 XP가 시뮬 상한을 넘어요: cap(레벨당 1,000) 이후 속도 확인",
  },
  {
    metric: "4주 중 완료한 날 (중앙값)",
    beta: (b) => b.active_days_p50,
    sim: (f) => f.activeDays,
    below: "돌아오지 않아요: 복귀(comeback) 문구·가벼운 계획, 알림 없이 다시 열 이유",
    above: "시뮬보다 자주 와요 — 좋은 신호",
  },
  {
    metric: "오늘의 모험 퀘스트 수 (평균)",
    beta: (b) => b.plan_size_avg,
    sim: (f) => f.planSize,
    below: "계획이 작아요: 기본 하루 용량(daily_capacity_min)·DEFAULT_MINUTES",
    above: "계획이 커요: MAX_PICKS·용량, 습관 수",
  },
  {
    metric: "추천 완료율 % (같은 날)",
    beta: (b) => b.done_rate_pct,
    sim: (f) => f.doneRate,
    below: "추천을 다 못 해요: 용량 대비 load 가중치(RECOMMEND_WEIGHTS.load), 가벼운 날 기준",
    above: "추천을 늘 다 해요: 더 담기 사용률과 함께 용량을 올려 볼 만해요",
  },
  {
    metric: "계획에서 뺀 퀘스트 (평균)",
    beta: (b) => b.removed_per_plan_avg,
    sim: (f) => f.removedPerPlan,
    below: "거의 안 빼요 — 추천이 맞거나 편집을 못 찾는 중 (UI 확인)",
    above: "자주 빼요: 빠지는 퀘스트 유형 확인, RECOMMEND_WEIGHTS·SNOOZE_DAYS",
  },
];

const round = (n: number) => Math.round(n * 10) / 10;

export function compareBeta(beta: BetaMetrics, runs: readonly SimResult[]): ComparisonRow[] {
  const figures = runs.map(simFigures);
  return METRICS.map((spec) => {
    const values = figures.map(spec.sim);
    const simMin = round(Math.min(...values));
    const simMax = round(Math.max(...values));
    const raw = spec.beta(beta);
    const value = raw === null ? null : round(raw);
    const verdict: Verdict =
      value === null ? "no-data" : value < simMin ? "below" : value > simMax ? "above" : "within";
    return {
      metric: spec.metric,
      beta: value,
      simMin,
      simMax,
      verdict,
      hint: verdict === "below" ? spec.below : verdict === "above" ? spec.above : null,
    };
  });
}

const MARK: Record<Verdict, string> = {
  below: "▼ 시뮬보다 낮음",
  within: "범위 안",
  above: "▲ 시뮬보다 높음",
  "no-data": "데이터 없음",
};

export function comparisonMarkdown(beta: BetaMetrics, rows: readonly ComparisonRow[]): string {
  const lines = [
    "# 베타 vs 4주 시뮬레이션",
    "",
    `> 베타: 1주 지난 플레이어 ${beta.players_week1}명, 4주 지난 플레이어 ${beta.players_month1}명, 오늘의 모험 ${beta.plans}회. 시뮬 범위는 페르소나 5명 × (수동, 적극) 10개 삶의 최솟값–최댓값.`,
  ];
  if (beta.players_week1 < MIN_BETA_PLAYERS) {
    lines.push(
      `> ⚠ 플레이어가 ${MIN_BETA_PLAYERS}명 미만이라 중앙값이 흔들려요. 가중치를 바꾸기 전에 표본을 더 모으세요.`,
    );
  }
  lines.push(
    "",
    "| 지표 | 베타 | 시뮬 범위 | 판정 | 먼저 볼 곳 |",
    "|---|---|---|---|---|",
    ...rows.map(
      (r) =>
        `| ${r.metric} | ${r.beta ?? "—"} | ${r.simMin}–${r.simMax} | ${MARK[r.verdict]} | ${r.hint ?? ""} |`,
    ),
    "",
    "규칙을 바꾸면 `pnpm sim --write`로 SIMULATION.md를 다시 만들고 GAME_SYSTEM/GAME_MASTER 문서도 같은 PR에서 고친다.",
  );
  return lines.join("\n") + "\n";
}
