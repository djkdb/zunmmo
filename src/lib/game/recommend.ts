import type { StoredQuestStatus } from "./quests";
import { type RepeatRule, isDueOn, isoWeekStart } from "./repeat";
import { type GameDate, daysBetween } from "./time";
import { type Difficulty, type QuestType, STATS, type Stat } from "./types";

/**
 * Today's Adventure — deterministic recommendation (GAME_SYSTEM §8, GAME_MASTER §3).
 * Same input → same picks. No external API, no randomness.
 */

export const RECOMMEND_WEIGHTS = {
  urgency: 3,
  boss: 1.5,
  dueToday: 2,
  main: 1.2,
  balance: 0.5,
  load: 1,
} as const;

export const MAX_PICKS = 6;

/** Default length when the player left `estimated_minutes` empty (GAME_SYSTEM §8). */
export const DEFAULT_MINUTES: Readonly<Record<Difficulty, number>> = {
  1: 15,
  2: 30,
  3: 60,
  4: 90,
  5: 120,
};

/** Urgency of a quest whose deadline already passed — still a candidate ("다시 도전"), never top. */
const EXPIRED_URGENCY = 0.3;

export interface RecommendQuest {
  id: string;
  type: QuestType;
  /** Effective status (expired derived). */
  status: StoredQuestStatus;
  difficulty: Difficulty;
  xp: number;
  primaryStat: Stat;
  deadline: GameDate | null;
  repeat: RepeatRule | null;
  goalId: string | null;
  estimatedMinutes: number | null;
  createdAt: string;
  /** Tie-breaker for steps created in one batch. */
  sortOrder?: number;
}

export interface RecommendInput {
  quests: readonly RecommendQuest[];
  /** Completions since at least this ISO week's Monday. */
  completions: ReadonlyArray<{ questId: string; occurrenceDate: GameDate }>;
  /** Active questline id → progress ratio (0–1). */
  questlineProgress: Readonly<Record<string, number>>;
  /** XP earned per stat over the last 7 days. */
  statXpLast7Days: Readonly<Record<Stat, number>>;
  /** Minutes already taken by fixed schedules today. */
  scheduledMinutes: number;
  /** profiles.daily_capacity_min */
  capacityMinutes: number;
  today: GameDate;
}

export type PickReason = "boss" | "deadline" | "daily" | "questline" | "balance" | "open";

export interface RecommendedQuest {
  questId: string;
  score: number;
  minutes: number;
  xp: number;
  reason: PickReason;
}

export interface Recommendation {
  picks: RecommendedQuest[];
  /** Every eligible quest, best first (for a custom plan). */
  candidates: RecommendedQuest[];
  totalXp: number;
  totalMinutes: number;
  /** Capacity left after schedules. */
  capacity: number;
}

export function questMinutes(
  quest: Pick<RecommendQuest, "estimatedMinutes" | "difficulty">,
): number {
  return quest.estimatedMinutes ?? DEFAULT_MINUTES[quest.difficulty];
}

/** 1 / max(1, daysLeft): D-0 and D-1 → 1, D-2 → 0.5 … no deadline → 0. */
export function urgency(deadline: GameDate | null, today: GameDate): number {
  if (!deadline) return 0;
  const daysLeft = daysBetween(today, deadline);
  if (daysLeft < 0) return EXPIRED_URGENCY;
  return 1 / Math.max(1, daysLeft);
}

/** 0 for the stat grown most this week, up to 1 for one not grown at all. 0 when nothing grew. */
export function statNeglect(stat: Stat, xpLast7Days: Readonly<Record<Stat, number>>): number {
  const peak = Math.max(0, ...STATS.map((s) => xpLast7Days[s] ?? 0));
  if (peak === 0) return 0;
  return 1 - Math.max(0, xpLast7Days[stat] ?? 0) / peak;
}

/** Candidates: open one-off quests + dailies due today and not yet done today. */
export function eligibleQuests(input: Pick<RecommendInput, "quests" | "completions" | "today">) {
  const { quests, completions, today } = input;
  const weekStart = isoWeekStart(today);
  return quests.filter((q) => {
    if (q.type === "daily") {
      if (q.status !== "active" || !q.repeat) return false;
      const mine = completions.filter((c) => c.questId === q.id);
      if (mine.some((c) => c.occurrenceDate === today)) return false;
      const thisWeek = mine.filter((c) => c.occurrenceDate >= weekStart).length;
      return isDueOn(q.repeat, today, thisWeek);
    }
    return q.status === "active" || q.status === "expired";
  });
}

/** Earliest-created open main quest of each questline = its next step. */
function nextSteps(quests: readonly RecommendQuest[]): Set<string> {
  const byGoal = new Map<string, RecommendQuest>();
  for (const q of quests) {
    if (q.type !== "main" || !q.goalId || q.status === "completed" || q.status === "archived") {
      continue;
    }
    const current = byGoal.get(q.goalId);
    const earlier =
      !current ||
      q.createdAt < current.createdAt ||
      (q.createdAt === current.createdAt && (q.sortOrder ?? 0) < (current.sortOrder ?? 0));
    if (earlier) byGoal.set(q.goalId, q);
  }
  return new Set([...byGoal.values()].map((q) => q.id));
}

export function scoreQuest(
  quest: RecommendQuest,
  context: {
    today: GameDate;
    capacity: number;
    isNextStep: boolean;
    questlineProgress: Readonly<Record<string, number>>;
    statXpLast7Days: Readonly<Record<Stat, number>>;
  },
): { score: number; reason: PickReason } {
  const w = RECOMMEND_WEIGHTS;
  const parts: Record<Exclude<PickReason, "open">, number> = {
    deadline: w.urgency * urgency(quest.deadline, context.today),
    boss: quest.type === "boss" ? w.boss : 0,
    daily: quest.type === "daily" ? w.dueToday : 0,
    // Progressing questlines pull harder; even a fresh one gets half weight on its next step.
    questline:
      quest.type === "main" && context.isNextStep && quest.goalId
        ? w.main * (0.5 + 0.5 * (context.questlineProgress[quest.goalId] ?? 0))
        : 0,
    balance: w.balance * statNeglect(quest.primaryStat, context.statXpLast7Days),
  };
  const load = (w.load * questMinutes(quest)) / Math.max(1, context.capacity);
  const score = Object.values(parts).reduce((a, b) => a + b, 0) - load;

  // A boss is always reported as a boss; otherwise the biggest contributor names the pick.
  let reason: PickReason = "open";
  if (quest.type === "boss") reason = "boss";
  else {
    let best = 0;
    for (const [key, value] of Object.entries(parts) as Array<[PickReason, number]>) {
      if (value > best) {
        best = value;
        reason = key;
      }
    }
  }
  return { score: Math.round(score * 1000) / 1000, reason };
}

export function recommendToday(input: RecommendInput): Recommendation {
  const capacity = Math.max(0, input.capacityMinutes - Math.max(0, input.scheduledMinutes));
  const steps = nextSteps(input.quests);
  const byId = new Map(input.quests.map((q) => [q.id, q]));

  const candidates: RecommendedQuest[] = eligibleQuests(input)
    .map((quest) => {
      const { score, reason } = scoreQuest(quest, {
        today: input.today,
        capacity: Math.max(capacity, 1),
        isNextStep: steps.has(quest.id),
        questlineProgress: input.questlineProgress,
        statXpLast7Days: input.statXpLast7Days,
      });
      return { questId: quest.id, score, minutes: questMinutes(quest), xp: quest.xp, reason };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const da = byId.get(a.questId)!.deadline ?? "9999-12-31";
      const db = byId.get(b.questId)!.deadline ?? "9999-12-31";
      if (da !== db) return da < db ? -1 : 1;
      if (b.xp !== a.xp) return b.xp - a.xp;
      return a.questId < b.questId ? -1 : 1;
    });

  // Bosses due today or tomorrow always make the list, capacity or not.
  const forced = candidates.filter((c) => {
    const q = byId.get(c.questId)!;
    if (q.type !== "boss" || !q.deadline) return false;
    const daysLeft = daysBetween(input.today, q.deadline);
    return daysLeft >= 0 && daysLeft <= 1;
  });

  const picks = forced.slice(0, MAX_PICKS);
  let minutes = picks.reduce((sum, p) => sum + p.minutes, 0);
  for (const c of candidates) {
    if (picks.length >= MAX_PICKS) break;
    if (picks.includes(c)) continue;
    if (minutes + c.minutes > capacity) continue;
    picks.push(c);
    minutes += c.minutes;
  }
  if (picks.length === 0 && candidates.length > 0) {
    picks.push(candidates[0]!);
    minutes = candidates[0]!.minutes;
  }

  // Present in score order, forced bosses included.
  picks.sort((a, b) => candidates.indexOf(a) - candidates.indexOf(b));

  return {
    picks,
    candidates,
    totalXp: picks.reduce((sum, p) => sum + p.xp, 0),
    totalMinutes: minutes,
    capacity,
  };
}
