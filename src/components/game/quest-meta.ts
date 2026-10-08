import type { IconName } from "@/components/pixel/icons.generated";
import type { QuestType, Stat } from "@/lib/game";

/** Presentation metadata for quest types — labels, icons (color lives in tokens.css). */
export const QUEST_TYPE_META: Record<QuestType, { label: string; ko: string; icon: IconName }> = {
  main: { label: "MAIN", ko: "메인 퀘스트", icon: "quest-main" },
  daily: { label: "DAILY", ko: "데일리 퀘스트", icon: "quest-daily" },
  side: { label: "SIDE", ko: "사이드 퀘스트", icon: "quest-side" },
  boss: { label: "BOSS", ko: "보스 퀘스트", icon: "quest-boss" },
  hidden: { label: "HIDDEN", ko: "히든 퀘스트", icon: "quest-hidden" },
};

/** Stats describe where effort went — growth record wording, never judgement (GAME_SYSTEM §5). */
export const STAT_META: Record<Stat, { label: string; ko: string; icon: IconName }> = {
  int: { label: "INT", ko: "학습", icon: "stat-int" },
  foc: { label: "FOC", ko: "집중", icon: "stat-foc" },
  vit: { label: "VIT", ko: "활력", icon: "stat-vit" },
  soc: { label: "SOC", ko: "관계", icon: "stat-soc" },
  cre: { label: "CRE", ko: "창작", icon: "stat-cre" },
};
