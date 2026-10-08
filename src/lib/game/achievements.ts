import { levelFromXp } from "./level";
import { statLevel } from "./stats";
import { STATS, type QuestType, type Stat } from "./types";

/**
 * Achievement badges (GAME_SYSTEM §7). Badges grant no XP — XP only moves through quests
 * and questline clears — so unlocking can safely be done from the app layer.
 */
export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface ProgressSnapshot {
  completions: number;
  byType: Partial<Record<QuestType, number>>;
  goalsCleared: number;
  earlyBird: number;
  totalXp: number;
  statXp: Record<Stat, number>;
  adventureStreak: number;
}

export type AchievementCriteria =
  | { kind: "quests_completed"; count: number; questType?: QuestType }
  | { kind: "level_reached"; level: number }
  | { kind: "goal_cleared"; count: number }
  | { kind: "adventure_streak"; days: number }
  | { kind: "early_bird"; count: number }
  | { kind: "all_stats_level"; level: number };

export interface Achievement {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  /** Icon key from the pixel icon atlas. */
  icon: string;
  criteria: AchievementCriteria;
}

export const ACHIEVEMENTS: readonly Achievement[] = [
  {
    id: "first_step",
    name: "첫 걸음",
    description: "퀘스트를 처음 완료했어요.",
    rarity: "common",
    icon: "ui-check",
    criteria: { kind: "quests_completed", count: 1 },
  },
  {
    id: "quests_10",
    name: "꾸준한 모험가",
    description: "퀘스트 10개 완료",
    rarity: "common",
    icon: "ui-quests",
    criteria: { kind: "quests_completed", count: 10 },
  },
  {
    id: "quests_50",
    name: "베테랑의 발자국",
    description: "퀘스트 50개 완료",
    rarity: "rare",
    icon: "ui-adventure",
    criteria: { kind: "quests_completed", count: 50 },
  },
  {
    id: "quests_100",
    name: "백 개의 퀘스트",
    description: "퀘스트 100개 완료",
    rarity: "epic",
    icon: "ui-sword",
    criteria: { kind: "quests_completed", count: 100 },
  },
  {
    id: "daily_30",
    name: "습관의 힘",
    description: "데일리 퀘스트 30회 완료",
    rarity: "rare",
    icon: "quest-daily",
    criteria: { kind: "quests_completed", count: 30, questType: "daily" },
  },
  {
    id: "side_10",
    name: "자유로운 영혼",
    description: "사이드 퀘스트 10개 완료",
    rarity: "common",
    icon: "quest-side",
    criteria: { kind: "quests_completed", count: 10, questType: "side" },
  },
  {
    id: "boss_slayer_1",
    name: "첫 보스 토벌",
    description: "보스 퀘스트를 처음 처치했어요.",
    rarity: "rare",
    icon: "quest-boss",
    criteria: { kind: "quests_completed", count: 1, questType: "boss" },
  },
  {
    id: "boss_slayer_5",
    name: "보스 사냥꾼",
    description: "보스 퀘스트 5개 처치",
    rarity: "epic",
    icon: "quest-boss",
    criteria: { kind: "quests_completed", count: 5, questType: "boss" },
  },
  {
    id: "questline_clear_1",
    name: "이야기의 끝",
    description: "메인 퀘스트라인을 처음 클리어했어요.",
    rarity: "rare",
    icon: "quest-main",
    criteria: { kind: "goal_cleared", count: 1 },
  },
  {
    id: "level_5",
    name: "모험가",
    description: "레벨 5 달성",
    rarity: "common",
    icon: "ui-character",
    criteria: { kind: "level_reached", level: 5 },
  },
  {
    id: "level_10",
    name: "숙련 모험가",
    description: "레벨 10 달성",
    rarity: "rare",
    icon: "ui-character",
    criteria: { kind: "level_reached", level: 10 },
  },
  {
    id: "level_20",
    name: "베테랑",
    description: "레벨 20 달성",
    rarity: "epic",
    icon: "ui-character",
    criteria: { kind: "level_reached", level: 20 },
  },
  {
    id: "adventure_streak_7",
    name: "일주일의 의지",
    description: "7일 연속 모험",
    rarity: "rare",
    icon: "stat-vit",
    criteria: { kind: "adventure_streak", days: 7 },
  },
  {
    id: "adventure_streak_30",
    name: "한 달의 전설",
    description: "30일 연속 모험",
    rarity: "legendary",
    icon: "stat-cre",
    criteria: { kind: "adventure_streak", days: 30 },
  },
  {
    id: "early_bird_10",
    name: "새벽의 모험가",
    description: "아침 7시 전에 퀘스트 10번 완료",
    rarity: "rare",
    icon: "quest-daily",
    criteria: { kind: "early_bird", count: 10 },
  },
  {
    id: "balanced_5",
    name: "균형 잡힌 영웅",
    description: "모든 스탯 Lv.5",
    rarity: "legendary",
    icon: "stat-foc",
    criteria: { kind: "all_stats_level", level: 5 },
  },
];

export function isAchieved(criteria: AchievementCriteria, p: ProgressSnapshot): boolean {
  switch (criteria.kind) {
    case "quests_completed":
      return (
        (criteria.questType ? (p.byType[criteria.questType] ?? 0) : p.completions) >= criteria.count
      );
    case "level_reached":
      return levelFromXp(p.totalXp) >= criteria.level;
    case "goal_cleared":
      return p.goalsCleared >= criteria.count;
    case "adventure_streak":
      return p.adventureStreak >= criteria.days;
    case "early_bird":
      return p.earlyBird >= criteria.count;
    case "all_stats_level":
      return STATS.every((s) => statLevel(p.statXp[s]) >= criteria.level);
  }
}

/** Achievements reached by `progress` that are not in `unlocked` yet, in catalog order. */
export function newlyUnlocked(
  progress: ProgressSnapshot,
  unlocked: ReadonlySet<string>,
): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !unlocked.has(a.id) && isAchieved(a.criteria, progress));
}

export function achievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
