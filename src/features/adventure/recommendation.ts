import "server-only";

import { listSchedules } from "@/features/calendar/queries";
import type { PlayerWithCharacter } from "@/features/player/queries";
import {
  type CompletionLog,
  listCompletionsSince,
  listPlayDates,
  statXpSince,
} from "@/features/progress/queries";
import type { QuestView, QuestlineView } from "@/features/quests/queries";
import { listQuestlines, listQuests } from "@/features/quests/queries";
import {
  type Briefing,
  type GameDate,
  type Recommendation,
  type RecommendQuest,
  addDays,
  NIGHT_OWL_NIGHTS,
  SNOOZE_DAYS,
  adventurePace,
  briefing,
  currentStreak,
  daysBetween,
  isLateNight,
  isoWeekStart,
  recommendToday,
} from "@/lib/game";
import { toLocal } from "@/lib/utils/zoned";

import { listRecentRemovals } from "./queries";

export function toRecommendQuest(q: QuestView): RecommendQuest {
  return {
    id: q.id,
    type: q.type,
    status: q.status,
    difficulty: q.difficulty,
    xp: q.xp,
    primaryStat: q.primaryStat,
    deadline: q.deadline,
    repeat: q.repeat,
    goalId: q.goal?.id ?? null,
    estimatedMinutes: q.estimatedMinutes,
    createdAt: q.createdAt,
    sortOrder: q.sortOrder,
  };
}

/** Earliest date the recommendation needs completions from (this ISO week, last 7 days). */
export function completionWindowStart(today: GameDate): GameDate {
  const weekStart = isoWeekStart(today);
  const lastWeek = addDays(today, -6);
  return weekStart < lastWeek ? weekStart : lastWeek;
}

export interface TodayPlan {
  recommendation: Recommendation;
  briefing: Briefing;
  /** Fixed schedules today, so the panel can say what the plan already accounts for. */
  schedules: { count: number; minutes: number };
  /** Plays late at night often enough that a later day start would suit them. */
  nightOwl: boolean;
}

/**
 * Everything the Game Master decides for today, from one set of inputs: the pace (night,
 * comeback), the recommendation and the briefing line — so the words and the plan agree.
 * Pass already-loaded board data to skip refetching.
 */
export async function planToday(
  player: PlayerWithCharacter,
  today: GameDate,
  loaded: Partial<{
    quests: QuestView[];
    questlines: QuestlineView[];
    completions: CompletionLog[];
  }> = {},
): Promise<TodayPlan> {
  const [quests, questlines, completions, statXp, schedules, playDates, removals] =
    await Promise.all([
      loaded.quests ?? listQuests(today),
      loaded.questlines ?? listQuestlines(today),
      loaded.completions ?? listCompletionsSince(completionWindowStart(today)),
      statXpSince(addDays(today, -6)),
      listSchedules(player, today, today),
      listPlayDates(),
      listRecentRemovals(addDays(today, -SNOOZE_DAYS)),
    ]);
  const tz = player.profile.timezone;
  const dayStartHour = player.profile.dayStartHour;
  const localHour = Number(toLocal(new Date(), tz).time.slice(0, 2));
  const nightsLastWeek = new Set(
    completions
      .filter(
        (c) =>
          c.completedAt &&
          c.occurrenceDate >= addDays(today, -6) &&
          isLateNight(Number(toLocal(new Date(c.completedAt), tz).time.slice(0, 2)), dayStartHour),
      )
      .map((c) => c.occurrenceDate),
  ).size;
  const lastPlayedDate = playDates.at(-1) ?? null;
  const scheduledMinutes = schedules.reduce((sum, s) => sum + s.minutes, 0);

  const recommendation = recommendToday({
    quests: quests.map(toRecommendQuest),
    completions,
    questlineProgress: Object.fromEntries(
      questlines.filter((l) => l.status === "active").map((l) => [l.id, l.progress.ratio]),
    ),
    statXpLast7Days: statXp,
    scheduledMinutes,
    capacityMinutes: player.profile.dailyCapacityMin,
    today,
    pace: adventurePace({ today, localHour, dayStartHour, lastPlayedDate }),
    removals,
  });

  const boss =
    quests
      .filter(
        (q) =>
          q.type === "boss" &&
          q.status === "active" &&
          q.deadline !== null &&
          daysBetween(today, q.deadline) >= 0,
      )
      .sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1))[0] ?? null;

  return {
    recommendation,
    briefing: briefing({
      today,
      localHour,
      dayStartHour,
      completedToday: completions.filter((c) => c.occurrenceDate === today).length,
      boss: boss ? { title: boss.title, deadline: boss.deadline! } : null,
      adventureStreak: currentStreak(playDates, today),
      lastPlayedDate,
      totalMinutes: recommendation.totalMinutes,
      pickCount: recommendation.picks.length,
    }),
    schedules: { count: schedules.filter((s) => !s.allDay).length, minutes: scheduledMinutes },
    nightOwl: nightsLastWeek >= NIGHT_OWL_NIGHTS,
  };
}
