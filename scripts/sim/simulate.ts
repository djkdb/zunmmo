/**
 * Multi-day persona simulation on the real game rules (docs/PERSONAS.md §6).
 * The app runs on the server's clock, so weeks cannot be replayed end-to-end; instead this
 * drives lib/game day by day — recommendation, pace, completions, XP, levels, streaks,
 * questline clears, badges, briefings — with a seeded RNG so every run is identical.
 */
import {
  type AdventurePace,
  type BriefingSituation,
  type Difficulty,
  type GameDate,
  type QuestType,
  type Recommendation,
  type RecommendQuest,
  type RepeatRule,
  STATS,
  type Stat,
  addDays,
  adventurePace,
  briefing,
  currentStreak,
  effectiveStatus,
  goalClearBonus,
  isoWeekday,
  levelFromXp,
  newlyUnlocked,
  questXp,
  questlineProgress,
  recommendToday,
} from "../../src/lib/game";

export interface SimQuest {
  id: string;
  title: string;
  type: QuestType;
  difficulty: Difficulty;
  stat: Stat;
  minutes?: number;
  /** Days from the simulation start. */
  deadlineDay?: number;
  repeat?: RepeatRule;
  goal?: string;
}

export interface SimPersona {
  id: string;
  name: string;
  capacity: number;
  /** Local hour the player opens the app on day `d`, or null when they don't play. */
  playHour: (day: number, weekday: number) => number | null;
  /** profiles.day_start_hour on day `d` (default 4). */
  dayStartHour?: (day: number) => number;
  /** Chance a picked quest gets done (0–1). */
  diligence: number;
  /** Scheduled minutes by ISO weekday. */
  scheduleMinutes?: Partial<Record<number, number>>;
  quests: SimQuest[];
  /** Quests that appear later: day → quests. */
  arrivals?: Record<number, SimQuest[]>;
}

export interface SimDay {
  day: number;
  date: GameDate;
  played: boolean;
  pace: AdventurePace;
  situation: BriefingSituation | null;
  recommendation: Recommendation;
  /** Quest state the recommendation saw (for invariant checks). */
  seen: RecommendQuest[];
  completed: string[];
  xpGained: number;
  totalXp: number;
  level: number;
  streak: number;
  unlocked: string[];
  goalsCleared: string[];
}

export interface SimResult {
  persona: SimPersona;
  days: SimDay[];
  quests: Map<string, SimQuest>;
}

/** Small deterministic PRNG (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedOf(id: string): number {
  return [...id].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261);
}

export const SIM_START: GameDate = "2026-10-05"; // a Monday

export function simulate(
  persona: SimPersona,
  days: number,
  start: GameDate = SIM_START,
): SimResult {
  const random = rng(seedOf(persona.id));
  const quests = new Map<string, SimQuest>();
  const stored = new Map<string, "active" | "completed">();
  const createdDay = new Map<string, number>();
  const add = (q: SimQuest, day: number) => {
    quests.set(q.id, q);
    stored.set(q.id, "active");
    createdDay.set(q.id, day);
  };
  persona.quests.forEach((q) => add(q, 0));

  const completions: Array<{ questId: string; occurrenceDate: GameDate }> = [];
  const xpLog: Array<{ date: GameDate; amount: number; stat: Stat }> = [];
  const playDates: GameDate[] = [];
  const unlocked = new Set<string>();
  const clearedGoals = new Set<string>();
  let totalXp = 0;
  let earlyBird = 0;
  const log: SimDay[] = [];

  for (let day = 0; day < days; day++) {
    const date = addDays(start, day);
    for (const q of persona.arrivals?.[day] ?? []) add(q, day);
    const weekday = isoWeekday(date);
    const hour = persona.playHour(day, weekday);

    const view = (q: SimQuest): RecommendQuest => {
      const deadline = q.deadlineDay === undefined ? null : addDays(start, q.deadlineDay);
      return {
        id: q.id,
        type: q.type,
        status: effectiveStatus({ status: stored.get(q.id)!, deadline, type: q.type }, date),
        difficulty: q.difficulty,
        xp: questXp(q.type, q.difficulty),
        primaryStat: q.stat,
        deadline,
        repeat: q.repeat ?? null,
        goalId: q.goal ?? null,
        estimatedMinutes: q.minutes ?? null,
        createdAt: addDays(start, createdDayOf(q.id)) + "T00:00:00Z",
        sortOrder: [...quests.keys()].indexOf(q.id),
      };
    };
    const createdDayOf = (id: string) => createdDay.get(id) ?? 0;
    const seen = [...quests.values()].map(view);

    const goals = new Map<string, RecommendQuest[]>();
    for (const q of seen) if (q.goalId) goals.set(q.goalId, [...(goals.get(q.goalId) ?? []), q]);
    const statXpLast7Days = Object.fromEntries(STATS.map((s) => [s, 0])) as Record<Stat, number>;
    for (const e of xpLog) if (e.date >= addDays(date, -6)) statXpLast7Days[e.stat] += e.amount;

    const lastPlayedDate = playDates.at(-1) ?? null;
    const dayStartHour = persona.dayStartHour?.(day) ?? 4;
    const pace = adventurePace({
      today: date,
      localHour: hour ?? 12,
      dayStartHour,
      lastPlayedDate,
    });
    const recommendation = recommendToday({
      quests: seen,
      completions,
      questlineProgress: Object.fromEntries(
        [...goals]
          .filter(([g]) => !clearedGoals.has(g))
          .map(([g, steps]) => [g, questlineProgress(steps).ratio]),
      ),
      statXpLast7Days,
      scheduledMinutes: persona.scheduleMinutes?.[weekday] ?? 0,
      capacityMinutes: persona.capacity,
      today: date,
      pace,
    });

    const completed: string[] = [];
    const goalsCleared: string[] = [];
    let xpGained = 0;
    let situation: BriefingSituation | null = null;
    if (hour !== null) {
      const boss = seen
        .filter(
          (q) => q.type === "boss" && q.status === "active" && q.deadline && q.deadline >= date,
        )
        .sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1))[0];
      situation = briefing({
        today: date,
        localHour: hour,
        dayStartHour,
        completedToday: 0,
        boss: boss ? { title: quests.get(boss.id)!.title, deadline: boss.deadline! } : null,
        adventureStreak: currentStreak(playDates, date),
        lastPlayedDate,
        totalMinutes: recommendation.totalMinutes,
        pickCount: recommendation.picks.length,
      }).situation;

      for (const pick of recommendation.picks) {
        if (random() >= persona.diligence) continue;
        const q = quests.get(pick.questId)!;
        const xp = questXp(q.type, q.difficulty);
        completions.push({ questId: q.id, occurrenceDate: date });
        if (q.type !== "daily") stored.set(q.id, "completed");
        xpLog.push({ date, amount: xp, stat: q.stat });
        totalXp += xp;
        xpGained += xp;
        if (hour < 7) earlyBird += 1;
        completed.push(q.id);

        if (q.goal && !clearedGoals.has(q.goal)) {
          const steps = [...quests.values()].filter(
            (s) => s.goal === q.goal && (s.type === "main" || s.type === "boss"),
          );
          if (steps.every((s) => stored.get(s.id) === "completed")) {
            const bonus = goalClearBonus(
              steps.reduce((sum, s) => sum + questXp(s.type, s.difficulty), 0),
            );
            clearedGoals.add(q.goal);
            goalsCleared.push(q.goal);
            totalXp += bonus;
            xpGained += bonus;
            xpLog.push({ date, amount: bonus, stat: q.stat });
          }
        }
      }
      if (completed.length) playDates.push(date);
    }

    const byType: Partial<Record<QuestType, number>> = {};
    for (const c of completions) {
      const type = quests.get(c.questId)!.type;
      byType[type] = (byType[type] ?? 0) + 1;
    }
    const statXp = Object.fromEntries(STATS.map((s) => [s, 0])) as Record<Stat, number>;
    for (const e of xpLog) statXp[e.stat] += e.amount;
    const streak = currentStreak(playDates, date);
    const fresh = newlyUnlocked(
      {
        completions: completions.length,
        byType,
        goalsCleared: clearedGoals.size,
        earlyBird,
        totalXp,
        statXp,
        adventureStreak: streak,
      },
      unlocked,
    ).map((a) => a.id);
    fresh.forEach((id) => unlocked.add(id));

    log.push({
      day,
      date,
      played: hour !== null,
      pace,
      situation,
      recommendation,
      seen,
      completed,
      xpGained,
      totalXp,
      level: levelFromXp(totalXp),
      streak,
      unlocked: fresh,
      goalsCleared,
    });
  }
  return { persona, days: log, quests };
}

/** Headline numbers for the balance report. */
export function summarize(result: SimResult) {
  const { days } = result;
  const played = days.filter((d) => d.played);
  const picks = played.reduce((n, d) => n + d.recommendation.picks.length, 0);
  const done = played.reduce((n, d) => n + d.completed.length, 0);
  const firstLevelUp = days.find((d) => d.level >= 2)?.day ?? null;
  const week1 = days.slice(0, 7);
  // Deadlines: finished on time, finished late ("다시 도전"), or still open.
  const doneOn = new Map<string, number>();
  for (const d of days) for (const id of d.completed) if (!doneOn.has(id)) doneOn.set(id, d.day);
  const deadlines = { onTime: 0, late: 0, open: 0 };
  for (const q of result.quests.values()) {
    if (q.deadlineDay === undefined || q.deadlineDay >= days.length) continue;
    const day = doneOn.get(q.id);
    if (day === undefined) deadlines.open += 1;
    else if (day <= q.deadlineDay) deadlines.onTime += 1;
    else deadlines.late += 1;
  }
  return {
    totalXp: days.at(-1)?.totalXp ?? 0,
    level: days.at(-1)?.level ?? 1,
    levelUpsWeek1: (week1.at(-1)?.level ?? 1) - 1,
    firstLevelUpDay: firstLevelUp,
    xpPerActiveDay: played.length ? Math.round((days.at(-1)?.totalXp ?? 0) / played.length) : 0,
    activeDays: played.length,
    picksPerDay: played.length ? Math.round((picks / played.length) * 10) / 10 : 0,
    doneRate: picks ? Math.round((done / picks) * 100) : 0,
    maxStreak: Math.max(0, ...days.map((d) => d.streak)),
    deadlines,
    badges: days.flatMap((d) => d.unlocked.map((id) => ({ id, day: d.day }))),
    questlinesCleared: days.flatMap((d) => d.goalsCleared.map((g) => ({ goal: g, day: d.day }))),
  };
}
