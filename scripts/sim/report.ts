/**
 * `pnpm sim` — run the five persona lives for four weeks on the current rules and print the
 * balance report (docs/SIMULATION.md is this output, regenerated after rule changes).
 */
import { writeFileSync } from "node:fs";

import { LEVEL_CURVE, achievementById, xpToReachLevel } from "../../src/lib/game";
import { SIM_PERSONAS } from "./personas";
import { simulate, summarize } from "./simulate";

const DAYS = 28;

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

lines.push("", "## 배지 획득 시점", "");
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
