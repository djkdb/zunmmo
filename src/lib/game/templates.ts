import type { RepeatRule } from "./repeat";
import { CATEGORY_STAT, type QuestCategory } from "./stats";
import type { Difficulty, QuestType, Stat } from "./types";

/**
 * GAME_MASTER §5 — ready-made quest drafts. Stat comes from the category and XP from
 * questXp(); templates never carry XP.
 */
export interface QuestTemplate {
  id: string;
  category: QuestCategory;
  title: string;
  type: Exclude<QuestType, "hidden" | "main" | "boss">;
  difficulty: Difficulty;
  estimatedMinutes?: number;
  repeat?: RepeatRule;
}

const DAILY: RepeatRule = { freq: "daily" };
const WEEKDAYS_ONLY: RepeatRule = { freq: "weekly", weekdays: [1, 2, 3, 4, 5] };
const times = (n: number): RepeatRule => ({ freq: "weekly_count", timesPerWeek: n });

export const QUEST_TEMPLATES: readonly QuestTemplate[] = [
  // study
  {
    id: "study-vocab",
    category: "study",
    title: "영단어 30개 외우기",
    type: "daily",
    difficulty: 1,
    estimatedMinutes: 15,
    repeat: DAILY,
  },
  {
    id: "study-review",
    category: "study",
    title: "오늘 수업 복습하기",
    type: "daily",
    difficulty: 2,
    estimatedMinutes: 30,
    repeat: WEEKDAYS_ONLY,
  },
  {
    id: "study-lecture",
    category: "study",
    title: "온라인 강의 1강 듣기",
    type: "side",
    difficulty: 3,
    estimatedMinutes: 60,
  },
  {
    id: "study-reading",
    category: "study",
    title: "책 20쪽 읽기",
    type: "daily",
    difficulty: 1,
    estimatedMinutes: 20,
    repeat: DAILY,
  },
  {
    id: "study-problems",
    category: "study",
    title: "문제 10개 풀기",
    type: "side",
    difficulty: 2,
    estimatedMinutes: 40,
  },
  // work / project
  {
    id: "work-plan",
    category: "work",
    title: "오늘 할 일 3개 정하기",
    type: "daily",
    difficulty: 1,
    estimatedMinutes: 5,
    repeat: WEEKDAYS_ONLY,
  },
  {
    id: "work-deep",
    category: "work",
    title: "집중 작업 50분",
    type: "daily",
    difficulty: 3,
    estimatedMinutes: 50,
    repeat: WEEKDAYS_ONLY,
  },
  {
    id: "work-inbox",
    category: "admin",
    title: "메일함 비우기",
    type: "side",
    difficulty: 1,
    estimatedMinutes: 15,
  },
  {
    id: "project-commit",
    category: "project",
    title: "사이드 프로젝트 커밋 1개",
    type: "daily",
    difficulty: 2,
    estimatedMinutes: 45,
    repeat: times(3),
  },
  {
    id: "project-portfolio",
    category: "project",
    title: "포트폴리오 한 항목 정리",
    type: "side",
    difficulty: 3,
    estimatedMinutes: 90,
  },
  // health / exercise / sleep
  {
    id: "exercise-30",
    category: "exercise",
    title: "운동 30분",
    type: "daily",
    difficulty: 2,
    estimatedMinutes: 30,
    repeat: DAILY,
  },
  {
    id: "exercise-walk",
    category: "exercise",
    title: "산책 20분",
    type: "daily",
    difficulty: 1,
    estimatedMinutes: 20,
    repeat: DAILY,
  },
  {
    id: "exercise-gym",
    category: "exercise",
    title: "헬스장 가기",
    type: "daily",
    difficulty: 3,
    estimatedMinutes: 70,
    repeat: times(3),
  },
  {
    id: "exercise-stretch",
    category: "health",
    title: "스트레칭 10분",
    type: "daily",
    difficulty: 1,
    estimatedMinutes: 10,
    repeat: DAILY,
  },
  {
    id: "health-water",
    category: "health",
    title: "물 2L 마시기",
    type: "daily",
    difficulty: 1,
    repeat: DAILY,
  },
  {
    id: "health-checkup",
    category: "health",
    title: "건강검진 예약하기",
    type: "side",
    difficulty: 1,
    estimatedMinutes: 10,
  },
  {
    id: "sleep-early",
    category: "sleep",
    title: "자정 전에 잠들기",
    type: "daily",
    difficulty: 2,
    repeat: DAILY,
  },
  {
    id: "sleep-phone",
    category: "sleep",
    title: "자기 전 30분 폰 내려놓기",
    type: "daily",
    difficulty: 2,
    repeat: DAILY,
  },
  // social / family
  {
    id: "social-friend",
    category: "social",
    title: "친구에게 먼저 연락하기",
    type: "side",
    difficulty: 1,
    estimatedMinutes: 10,
  },
  {
    id: "social-meal",
    category: "social",
    title: "친구와 밥 먹기",
    type: "side",
    difficulty: 2,
    estimatedMinutes: 90,
  },
  {
    id: "family-call",
    category: "family",
    title: "부모님께 안부 전화",
    type: "daily",
    difficulty: 1,
    estimatedMinutes: 10,
    repeat: times(2),
  },
  {
    id: "family-time",
    category: "family",
    title: "가족과 저녁 시간 보내기",
    type: "side",
    difficulty: 2,
    estimatedMinutes: 90,
  },
  // hobby / creative / play
  {
    id: "creative-sketch",
    category: "creative",
    title: "그림 한 장 그리기",
    type: "side",
    difficulty: 2,
    estimatedMinutes: 40,
  },
  {
    id: "creative-journal",
    category: "creative",
    title: "하루 일기 쓰기",
    type: "daily",
    difficulty: 1,
    estimatedMinutes: 10,
    repeat: DAILY,
  },
  {
    id: "hobby-music",
    category: "hobby",
    title: "악기 연습 30분",
    type: "daily",
    difficulty: 2,
    estimatedMinutes: 30,
    repeat: times(3),
  },
  {
    id: "hobby-cook",
    category: "hobby",
    title: "새 요리 하나 해 보기",
    type: "side",
    difficulty: 2,
    estimatedMinutes: 60,
  },
  {
    id: "play-movie",
    category: "play",
    title: "보고 싶던 영화 보기",
    type: "side",
    difficulty: 1,
    estimatedMinutes: 120,
  },
  {
    id: "play-game",
    category: "play",
    title: "좋아하는 게임 한 판",
    type: "side",
    difficulty: 1,
    estimatedMinutes: 30,
  },
  // chores / admin
  {
    id: "chore-room",
    category: "chore",
    title: "방 정리 15분",
    type: "daily",
    difficulty: 1,
    estimatedMinutes: 15,
    repeat: times(2),
  },
  {
    id: "chore-laundry",
    category: "chore",
    title: "빨래 돌리고 개기",
    type: "side",
    difficulty: 1,
    estimatedMinutes: 30,
  },
  {
    id: "admin-budget",
    category: "admin",
    title: "이번 주 가계부 정리",
    type: "side",
    difficulty: 2,
    estimatedMinutes: 20,
  },
];

export function templateById(id: string): QuestTemplate | undefined {
  return QUEST_TEMPLATES.find((t) => t.id === id);
}

export function templateStat(template: QuestTemplate): Stat {
  return CATEGORY_STAT[template.category];
}

/** Category order and Korean labels for pickers. */
export const TEMPLATE_GROUPS: ReadonlyArray<{
  label: string;
  categories: readonly QuestCategory[];
}> = [
  { label: "공부", categories: ["study"] },
  { label: "일·프로젝트", categories: ["work", "project", "admin"] },
  { label: "건강", categories: ["exercise", "health", "sleep"] },
  { label: "관계", categories: ["social", "family"] },
  { label: "취미·휴식", categories: ["creative", "hobby", "play"] },
  { label: "생활", categories: ["chore"] },
];

/** Three easy starters shown first at onboarding: one habit for body, mind and life. */
export const STARTER_TEMPLATE_IDS = ["exercise-walk", "study-reading", "chore-room"] as const;
