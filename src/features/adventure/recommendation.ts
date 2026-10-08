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
  briefing,
  currentStreak,
  daysBetween,
  isoWeekStart,
  recommendToday,
} from "@/lib/game";
import { toLocal } from "@/lib/utils/zoned";

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

/** Gather everything recommendToday needs; pass already-loaded data to skip refetching. */
export async function recommendationFor(
  player: PlayerWithCharacter,
  today: GameDate,
  loaded: Partial<{
    quests: QuestView[];
    questlines: QuestlineView[];
    completions: CompletionLog[];
  }> = {},
): Promise<Recommendation> {
  const [quests, questlines, completions, statXp, schedules] = await Promise.all([
    loaded.quests ?? listQuests(today),
    loaded.questlines ?? listQuestlines(today),
    loaded.completions ?? listCompletionsSince(completionWindowStart(today)),
    statXpSince(addDays(today, -6)),
    listSchedules(player, today, today),
  ]);
  return recommendToday({
    quests: quests.map(toRecommendQuest),
    completions,
    questlineProgress: Object.fromEntries(
      questlines.filter((l) => l.status === "active").map((l) => [l.id, l.progress.ratio]),
    ),
    statXpLast7Days: statXp,
    scheduledMinutes: schedules.reduce((sum, s) => sum + s.minutes, 0),
    capacityMinutes: player.profile.dailyCapacityMin,
    today,
  });
}

/** The GM's line for today (GAME_MASTER §4), from the same data the board already loaded. */
export async function briefingFor(
  player: PlayerWithCharacter,
  today: GameDate,
  loaded: { quests: QuestView[]; completions: CompletionLog[] },
  recommendation: Recommendation,
): Promise<Briefing> {
  const playDates = await listPlayDates();
  const boss =
    loaded.quests
      .filter(
        (q) =>
          q.type === "boss" &&
          q.status === "active" &&
          q.deadline !== null &&
          daysBetween(today, q.deadline) >= 0,
      )
      .sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1))[0] ?? null;
  return briefing({
    today,
    localHour: Number(toLocal(new Date(), player.profile.timezone).time.slice(0, 2)),
    completedToday: loaded.completions.filter((c) => c.occurrenceDate === today).length,
    boss: boss ? { title: boss.title, deadline: boss.deadline! } : null,
    adventureStreak: currentStreak(playDates, today),
    lastPlayedDate: playDates.at(-1) ?? null,
    totalMinutes: recommendation.totalMinutes,
    pickCount: recommendation.picks.length,
  });
}
