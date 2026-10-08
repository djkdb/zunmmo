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

/**
 * Pace of the day (GAME_MASTER §3). Late at night and on the first day back the GM plans a
 * light day: a short warm-up instead of the full capacity, so the plan matches the briefing.
 */
export type AdventurePace = "normal" | "night" | "comeback";
export const LIGHT_PACE = { budgetMinutes: 60, maxPicks: 2 } as const;
/** Local hours before this count as late night (00:00–04:59). */
export const LATE_NIGHT_END_HOUR = 5;
/** Days since the last completion that make today a comeback. */
export const COMEBACK_GAP_DAYS = 3;
/**
 * Even when schedules or a forced boss use up the day, a few short quests still fit in the
 * gaps between them (GAME_SYSTEM §8, "틈새 시간").
 */
export const GAP_MINUTES = 30;

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
  /** Defaults to "normal"; see `adventurePace`. */
  pace?: AdventurePace;
}

export type PickReason = "boss" | "prep" | "deadline" | "daily" | "questline" | "balance" | "open";

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
  /** Minutes the plan was filled against (capacity, or the light-pace budget). */
  budget: number;
  pace: AdventurePace;
  /** The best quest left out only because it is longer than today's budget — "쪼개 볼까?". */
  tooBig: RecommendedQuest | null;
}

/** Night or comeback days get a light plan; night wins when both apply. */
export function adventurePace(input: {
  today: GameDate;
  localHour: number;
  lastPlayedDate: GameDate | null;
}): AdventurePace {
  if (input.localHour < LATE_NIGHT_END_HOUR) return "night";
  if (input.lastPlayedDate && daysBetween(input.lastPlayedDate, input.today) >= COMEBACK_GAP_DAYS) {
    return "comeback";
  }
  return "normal";
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

/**
 * A boss whose questline still has open main steps is an event to prepare for, not work to do
 * today — until it is due tomorrow. Its pressure moves to the questline's next step ("prep").
 */
function bossesAwaitingPrep(
  quests: readonly RecommendQuest[],
  today: GameDate,
): Map<string, RecommendQuest> {
  const openMainGoals = new Set(
    quests
      .filter(
        (q) => q.type === "main" && q.goalId && (q.status === "active" || q.status === "expired"),
      )
      .map((q) => q.goalId!),
  );
  const byGoal = new Map<string, RecommendQuest>();
  for (const q of quests) {
    if (q.type !== "boss" || q.status !== "active" || !q.goalId || !q.deadline) continue;
    if (!openMainGoals.has(q.goalId) || daysBetween(today, q.deadline) <= 1) continue;
    const current = byGoal.get(q.goalId);
    if (!current || q.deadline < current.deadline!) byGoal.set(q.goalId, q);
  }
  return byGoal;
}

/**
 * Candidates: open one-off quests + dailies due today and not yet done today. A boss whose
 * date has passed is over (it can be retried with a new date), and a boss still waiting on
 * its prep steps is played through those steps.
 */
export function eligibleQuests(input: Pick<RecommendInput, "quests" | "completions" | "today">) {
  const { quests, completions, today } = input;
  const weekStart = isoWeekStart(today);
  const awaitingPrep = new Set([...bossesAwaitingPrep(quests, today).values()].map((q) => q.id));
  return quests.filter((q) => {
    if (q.type === "boss" && (q.status === "expired" || awaitingPrep.has(q.id))) return false;
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
    /** Deadline of the boss this quest prepares for (next step of the boss's questline). */
    bossDeadline?: GameDate | null;
  },
): { score: number; reason: PickReason } {
  const w = RECOMMEND_WEIGHTS;
  const parts: Record<Exclude<PickReason, "open">, number> = {
    deadline: w.urgency * urgency(quest.deadline, context.today),
    boss: quest.type === "boss" ? w.boss : 0,
    // The next prep step carries the boss's date pressure and part of its weight.
    prep: context.bossDeadline
      ? w.urgency * urgency(context.bossDeadline, context.today) + w.boss / 2
      : 0,
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

/** Reasons worth a "split it" hint when the quest cannot fit today; a long movie is not one. */
const IMPORTANT: ReadonlySet<PickReason> = new Set(["questline", "prep", "deadline"]);

export function recommendToday(input: RecommendInput): Recommendation {
  const pace = input.pace ?? "normal";
  const capacity = Math.max(0, input.capacityMinutes - Math.max(0, input.scheduledMinutes));
  const light = pace !== "normal";
  const budget = light ? Math.min(capacity, LIGHT_PACE.budgetMinutes) : capacity;
  const maxPicks = light ? LIGHT_PACE.maxPicks : MAX_PICKS;

  const steps = nextSteps(input.quests);
  const byId = new Map(input.quests.map((q) => [q.id, q]));
  const prepBoss = bossesAwaitingPrep(input.quests, input.today);

  const candidates: RecommendedQuest[] = eligibleQuests(input)
    .map((quest) => {
      const isNextStep = steps.has(quest.id);
      const { score, reason } = scoreQuest(quest, {
        today: input.today,
        capacity: Math.max(capacity, 1),
        isNextStep,
        questlineProgress: input.questlineProgress,
        statXpLast7Days: input.statXpLast7Days,
        bossDeadline:
          isNextStep && quest.goalId ? (prepBoss.get(quest.goalId)?.deadline ?? null) : null,
      });
      return { questId: quest.id, score, minutes: questMinutes(quest), xp: quest.xp, reason };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const qa = byId.get(a.questId)!;
      const qb = byId.get(b.questId)!;
      const da = qa.deadline ?? "9999-12-31";
      const db = qb.deadline ?? "9999-12-31";
      if (da !== db) return da < db ? -1 : 1;
      // Equal quests keep the order the player made them in — routines read top to bottom.
      if (qa.createdAt !== qb.createdAt) return qa.createdAt < qb.createdAt ? -1 : 1;
      const sa = qa.sortOrder ?? 0;
      const sb = qb.sortOrder ?? 0;
      if (sa !== sb) return sa - sb;
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
  const forcedMinutes = picks.reduce((sum, p) => sum + p.minutes, 0);
  // Whatever the forced bosses and schedules leave, short quests still fit in the gaps.
  const fillBudget = Math.max(budget - forcedMinutes, GAP_MINUTES);
  let filled = 0;
  let tooBig: RecommendedQuest | null = null;
  for (const c of candidates) {
    if (picks.length >= Math.max(maxPicks, forced.length)) break;
    if (picks.includes(c)) continue;
    if (filled + c.minutes > fillBudget) {
      if (!tooBig && c.minutes > fillBudget && IMPORTANT.has(c.reason)) tooBig = c;
      continue;
    }
    picks.push(c);
    filled += c.minutes;
  }
  if (picks.length === 0 && candidates.length > 0) {
    picks.push(candidates[0]!);
    tooBig = null;
  }

  // Present in score order, forced bosses included.
  picks.sort((a, b) => candidates.indexOf(a) - candidates.indexOf(b));

  return {
    picks,
    candidates,
    totalXp: picks.reduce((sum, p) => sum + p.xp, 0),
    totalMinutes: picks.reduce((sum, p) => sum + p.minutes, 0),
    capacity,
    budget,
    pace,
    tooBig: tooBig && !picks.includes(tooBig) ? tooBig : null,
  };
}
