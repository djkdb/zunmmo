/**
 * Multi-day persona simulation on the real game rules (docs/PERSONAS.md §6).
 * The app runs on the server's clock, so weeks cannot be replayed end-to-end; instead this
 * drives lib/game day by day — recommendation, pace, completions, XP, levels, streaks,
 * questline clears, badges, briefings — with a seeded RNG so every run is identical.
 * An engaged run also uses the app's tools the way the persona would (SimPolicy).
 */
import {
  type AdventurePace,
  type BriefingSituation,
  type Difficulty,
  type GameDate,
  GAP_MINUTES,
  MAX_PLAN_SIZE,
  MAX_SPLIT_PARTS,
  MIN_SPLIT_PARTS,
  type QuestType,
  RETRY_DAYS,
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
  isSplittable,
  isoWeekday,
  levelFromXp,
  newlyUnlocked,
  questXp,
  questlineProgress,
  recommendToday,
  splitPlan,
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

/**
 * What an engaged player does with the app's tools (docs/PERSONAS.md §6.2). The passive run
 * ignores this and plays the GM's plan as given, so the report can show what the tools change.
 */
export interface SimPolicy {
  /** Follows the "단계로 나누기" link when the GM says a quest is too big for today. */
  splitTooBig?: boolean;
  /** "다시 도전" on expired quests (not bosses — a missed exam date does not move). */
  retryExpired?: boolean;
  /** Quests they always take out of the plan (×). */
  dropIds?: readonly string[];
  /** After finishing the plan, adds up to N more from "퀘스트 더 담기". */
  topUp?: number;
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
  /** How they use the app's tools when engaged. */
  policy?: SimPolicy;
}

export interface SimAction {
  kind: "split" | "retry" | "drop" | "add";
  questId: string;
  /** Split: the part ids; retry: the new deadline. */
  detail?: string;
  /** Split: the quest as it was before. */
  from?: SimQuest;
}

export interface SimDay {
  day: number;
  date: GameDate;
  played: boolean;
  pace: AdventurePace;
  situation: BriefingSituation | null;
  /** The GM's recommendation (after any split the player made before starting). */
  recommendation: Recommendation;
  /** Quest state the recommendation saw (for invariant checks). */
  seen: RecommendQuest[];
  /** The plan the player actually played: the recommendation plus their edits. */
  plan: string[];
  /** Tool use that day (engaged runs only). */
  actions: SimAction[];
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
  engaged: boolean;
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

/** Parts of a split quest are `${id}~2`, `${id}~3`…; the first part keeps the id. */
export const rootId = (id: string) => id.split("~")[0]!;

export function simulate(
  persona: SimPersona,
  days: number,
  options: { engaged?: boolean; start?: GameDate } = {},
): SimResult {
  const start = options.start ?? SIM_START;
  const engaged = options.engaged ?? false;
  const policy: SimPolicy = engaged ? (persona.policy ?? {}) : {};
  const random = rng(seedOf(persona.id));
  let quests = new Map<string, SimQuest>();
  const stored = new Map<string, "active" | "completed">();
  const createdDay = new Map<string, number>();
  const add = (q: SimQuest, day: number) => {
    quests.set(q.id, q);
    stored.set(q.id, "active");
    createdDay.set(q.id, day);
  };
  /** split_quest: the first part replaces the quest, the rest follow it in order. */
  const split = (id: string, parts: SimQuest[]) => {
    const next = new Map<string, SimQuest>();
    for (const [key, q] of quests) {
      if (key !== id) {
        next.set(key, q);
        continue;
      }
      for (const part of parts) {
        next.set(part.id, part);
        stored.set(part.id, "active");
        createdDay.set(part.id, createdDay.get(id) ?? 0);
      }
    }
    quests = next;
  };
  persona.quests.forEach((q) => add(q, 0));

  const completions: Array<{ questId: string; occurrenceDate: GameDate }> = [];
  const xpLog: Array<{ date: GameDate; amount: number; stat: Stat }> = [];
  const playDates: GameDate[] = [];
  const removals: Array<{ date: GameDate; questIds: string[] }> = [];
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
    const lastPlayedDate = playDates.at(-1) ?? null;
    const dayStartHour = persona.dayStartHour?.(day) ?? 4;
    const pace = adventurePace({
      today: date,
      localHour: hour ?? 12,
      dayStartHour,
      lastPlayedDate,
    });
    const actions: SimAction[] = [];

    // "다시 도전": expired quests get a fresh week when the player opens the app.
    if (policy.retryExpired && hour !== null) {
      for (const q of quests.values()) {
        if (q.type === "boss" || q.type === "daily" || q.deadlineDay === undefined) continue;
        if (stored.get(q.id) !== "active" || q.deadlineDay >= day) continue;
        const deadlineDay = day + RETRY_DAYS;
        quests.set(q.id, { ...q, deadlineDay });
        actions.push({ kind: "retry", questId: q.id, detail: addDays(start, deadlineDay) });
      }
    }

    const plan = () => {
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
          createdAt: addDays(start, createdDay.get(q.id) ?? 0) + "T00:00:00Z",
          sortOrder: [...quests.keys()].indexOf(q.id),
        };
      };
      const seen = [...quests.values()].map(view);
      const goals = new Map<string, RecommendQuest[]>();
      for (const q of seen) if (q.goalId) goals.set(q.goalId, [...(goals.get(q.goalId) ?? []), q]);
      const statXpLast7Days = Object.fromEntries(STATS.map((s) => [s, 0])) as Record<Stat, number>;
      for (const e of xpLog) if (e.date >= addDays(date, -6)) statXpLast7Days[e.stat] += e.amount;
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
        removals,
      });
      return { seen, recommendation };
    };

    let { seen, recommendation } = plan();
    // "단계로 나누기": split the too-big quest into parts that fit, then look at the plan again.
    const big = recommendation.tooBig ? quests.get(recommendation.tooBig.questId) : undefined;
    if (policy.splitTooBig && hour !== null && big && isSplittable(big.type) && big.minutes) {
      const target = Math.max(GAP_MINUTES, Math.floor(recommendation.budget / 2));
      const count = Math.min(
        MAX_SPLIT_PARTS,
        Math.max(MIN_SPLIT_PARTS, Math.ceil(big.minutes / target)),
      );
      const parts = splitPlan(
        { type: big.type, difficulty: big.difficulty, estimatedMinutes: big.minutes },
        Array.from({ length: count }, (_, i) => `${big.title} (${i + 1}/${count})`),
      ).map((part, i): SimQuest => ({
        ...big,
        id: i === 0 ? big.id : `${big.id}~${i + 1}`,
        title: part.title,
        difficulty: part.difficulty,
        minutes: part.estimatedMinutes ?? undefined,
      }));
      split(big.id, parts);
      actions.push({
        kind: "split",
        questId: big.id,
        detail: parts.map((p) => p.id).join(","),
        from: big,
      });
      ({ seen, recommendation } = plan());
    }

    // Plan edits: take out what they never do (×), keeping at least one quest.
    const played = recommendation.picks.map((p) => p.questId);
    for (const id of policy.dropIds ?? []) {
      const at = played.indexOf(id);
      if (at >= 0 && played.length > 1) {
        played.splice(at, 1);
        actions.push({ kind: "drop", questId: id });
      }
    }
    const dropped = actions.filter((a) => a.kind === "drop").map((a) => a.questId);
    if (dropped.length) removals.push({ date, questIds: dropped });

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

      const play = (id: string) => {
        if (random() >= persona.diligence) return;
        const q = quests.get(id)!;
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
      };
      played.forEach(play);

      // "퀘스트 더 담기": a finished plan with energy left takes the next best candidates.
      if (policy.topUp && completed.length === played.length) {
        const extras = recommendation.candidates
          .map((c) => c.questId)
          .filter((id) => !played.includes(id) && !(policy.dropIds ?? []).includes(id))
          .slice(0, Math.min(policy.topUp, MAX_PLAN_SIZE - played.length));
        for (const id of extras) {
          played.push(id);
          actions.push({ kind: "add", questId: id });
          play(id);
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
      plan: hour !== null ? played : [],
      actions,
      completed,
      xpGained,
      totalXp,
      level: levelFromXp(totalXp),
      streak,
      unlocked: fresh,
      goalsCleared,
    });
  }
  return { persona, engaged, days: log, quests };
}

/** Headline numbers for the balance report. */
export function summarize(result: SimResult) {
  const { days, persona } = result;
  const played = days.filter((d) => d.played);
  const picks = played.reduce((n, d) => n + d.plan.length, 0);
  const done = played.reduce((n, d) => n + d.completed.length, 0);
  const firstLevelUp = days.find((d) => d.level >= 2)?.day ?? null;
  const week1 = days.slice(0, 7);
  // Deadlines, judged against the original date (a split quest is done when all parts are;
  // a retried one finished after its first date counts as late — "다시 도전" worked).
  const doneOn = new Map<string, number>();
  for (const d of days) for (const id of d.completed) if (!doneOn.has(id)) doneOn.set(id, d.day);
  const originals = [...persona.quests, ...Object.values(persona.arrivals ?? {}).flat()];
  const deadlines = { onTime: 0, late: 0, open: 0 };
  for (const q of originals) {
    if (q.deadlineDay === undefined || q.deadlineDay >= days.length) continue;
    const parts = [...result.quests.keys()].filter((id) => rootId(id) === q.id);
    const finished = parts.map((id) => doneOn.get(id));
    if (finished.some((d) => d === undefined)) deadlines.open += 1;
    else if (Math.max(...(finished as number[])) <= q.deadlineDay) deadlines.onTime += 1;
    else deadlines.late += 1;
  }
  const actions = days.flatMap((d) => d.actions);
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
    actions: {
      split: actions.filter((a) => a.kind === "split").length,
      retry: actions.filter((a) => a.kind === "retry").length,
      drop: actions.filter((a) => a.kind === "drop").length,
      add: actions.filter((a) => a.kind === "add").length,
    },
  };
}
