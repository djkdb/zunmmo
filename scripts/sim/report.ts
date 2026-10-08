/**
 * `pnpm sim` — run the five persona lives for four weeks on the current rules and print the
 * balance report (docs/SIMULATION.md is this output, regenerated after rule changes).
 * `pnpm sim --compare beta.json` — compare beta metrics (beta-metrics.sql query 7) with it.
 */
import { readFileSync, writeFileSync } from "node:fs";

import { LEVEL_CURVE, achievementById, xpToReachLevel } from "../../src/lib/game";
import { SIM_PERSONAS } from "./personas";
import { compareBeta, comparisonMarkdown, parseBetaMetrics } from "./compare";
import { simulate, summarize } from "./simulate";

const DAYS = 28;

const compareAt = process.argv.indexOf("--compare");
if (compareAt >= 0) {
  const path = process.argv[compareAt + 1];
  if (!path) throw new Error("usage: pnpm sim --compare <beta.json>");
  const beta = parseBetaMetrics(JSON.parse(readFileSync(path, "utf8")));
  const runs = SIM_PERSONAS.flatMap((p) => [
    simulate(p, DAYS),
    simulate(p, DAYS, { engaged: true }),
  ]);
  console.log(comparisonMarkdown(beta, compareBeta(beta, runs)));
  process.exit(0);
}

function curveLabel(): string {
  const steps = [2, 3, 4, 5, 10].map((l) => `Lv.${l} ${xpToReachLevel(l).toLocaleString("ko-KR")}`);
  return `${LEVEL_CURVE.kind} — ${steps.join(" · ")}`;
}

const lines: string[] = [
  "# 4주 페르소나 시뮬레이션 (자동 생성)",
  "",
  "> `pnpm sim`이 만든 파일이다 — 손으로 고치지 않는다. 규칙(`src/lib/game`)이 바뀌면 다시 생성한다.",
  `> 시작 ${"2026-10-05"}(월)부터 ${DAYS}일, 페르소나별 고정 시드. 레벨 곡선: ${curveLabel()}`,
  "",
  "## 추천대로만 플레이 (수동)",
  "",
  "| 페르소나 | 플레이한 날 | 하루 추천 | 완료율 | 첫 레벨업 | 1주차 레벨업 | 4주 XP | 4주 레벨 | 최장 연속 | 배지 | 퀘스트라인 클리어 | 마감 (기한 내/늦게/미완) |",
  "|---|---|---|---|---|---|---|---|---|---|---|---|",
];

for (const persona of SIM_PERSONAS) {
  const s = summarize(simulate(persona, DAYS));
  lines.push(
    `| ${persona.name} | ${s.activeDays}/${DAYS} | ${s.picksPerDay}개 | ${s.doneRate}% | ${
      s.firstLevelUpDay === null ? "—" : `${s.firstLevelUpDay + 1}일째`
    } | ${s.levelUpsWeek1}회 | ${s.totalXp.toLocaleString("ko-KR")} | Lv.${s.level} | ${s.maxStreak}일 | ${
      s.badges.length
    } | ${s.questlinesCleared.map((q) => `${q.day + 1}일째`).join(", ") || "—"} | ${s.deadlines.onTime}/${
      s.deadlines.late
    }/${s.deadlines.open} |`,
  );
}

const fmtDeadlines = (d: { onTime: number; late: number; open: number }) =>
  `${d.onTime}/${d.late}/${d.open}`;
const fmtLines = (q: Array<{ day: number }>) => q.map((c) => `${c.day + 1}일째`).join(", ") || "—";

lines.push(
  "",
  "## 앱 기능을 쓰면 (수동 → 적극)",
  "",
  '> 적극 플레이: 페르소나마다 실제로 할 법한 행동만 — GM이 "안 들어가요"라고 하면 단계로 나누기, 공백 뒤 다시 도전, 늘 미루는 퀘스트 빼기(×), 다 끝내면 더 담기 (`scripts/sim/personas.ts`의 `policy`).',
  "",
  "| 페르소나 | 쓴 기능 | 4주 XP | 4주 레벨 | 퀘스트라인 클리어 | 마감 (기한 내/늦게/미완) |",
  "|---|---|---|---|---|---|",
);
for (const persona of SIM_PERSONAS) {
  const p = summarize(simulate(persona, DAYS));
  const e = summarize(simulate(persona, DAYS, { engaged: true }));
  const used = [
    e.actions.split && `나누기 ${e.actions.split}`,
    e.actions.retry && `다시 도전 ${e.actions.retry}`,
    e.actions.drop && `빼기 ${e.actions.drop}`,
    e.actions.add && `더 담기 ${e.actions.add}`,
  ]
    .filter(Boolean)
    .join(" · ");
  lines.push(
    `| ${persona.name} | ${used || "없음 (추천 그대로)"} | ${p.totalXp.toLocaleString("ko-KR")} → ${e.totalXp.toLocaleString("ko-KR")} | Lv.${p.level} → Lv.${e.level} | ${fmtLines(p.questlinesCleared)} → ${fmtLines(e.questlinesCleared)} | ${fmtDeadlines(p.deadlines)} → ${fmtDeadlines(e.deadlines)} |`,
  );
}

lines.push("", "## 배지 획득 시점 (수동)", "");
for (const persona of SIM_PERSONAS) {
  const s = summarize(simulate(persona, DAYS));
  const badges = s.badges
    .map((b) => `${achievementById(b.id)?.name ?? b.id}(${b.day + 1}일)`)
    .join(", ");
  lines.push(`- **${persona.name}**: ${badges || "없음"}`);
}

const out = lines.join("\n") + "\n";
if (process.argv.includes("--write")) {
  writeFileSync("docs/SIMULATION.md", out);
  console.log("wrote docs/SIMULATION.md");
} else {
  console.log(out);
}
