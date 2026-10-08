import type { QuestView, QuestlineView } from "@/features/quests/queries";
import { type GameDate, daysBetween, isDueOn, isoWeekStart } from "@/lib/game";

export const BOSS_ALERT_DAYS = 7;
export const MAX_QUESTLINES = 2;
export const MAX_SIDE_QUESTS = 3;

export interface AdventureBoard {
  boss: QuestView | null;
  questlines: QuestlineView[];
  dailies: Array<{ quest: QuestView; doneToday: boolean }>;
  sides: QuestView[];
  isEmpty: boolean;
}

export interface CompletionLog {
  questId: string;
  occurrenceDate: GameDate;
}

/**
 * Pick what the adventure screen shows (UI_GUIDE §4.1): nearest boss within a week,
 * up to two active questlines, today's dailies, a few side quests.
 */
export function selectBoard(
  quests: readonly QuestView[],
  questlines: readonly QuestlineView[],
  today: GameDate,
  completions: readonly CompletionLog[] = [],
): AdventureBoard {
  const active = quests.filter((q) => q.status === "active");

  const boss =
    active
      .filter(
        (q) => q.type === "boss" && q.deadline && daysBetween(today, q.deadline) <= BOSS_ALERT_DAYS,
      )
      .sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""))[0] ?? null;

  const weekStart = isoWeekStart(today);
  const dailies = active
    .filter((q) => q.type === "daily" && q.repeat)
    .map((quest) => {
      const mine = completions.filter((c) => c.questId === quest.id);
      const doneToday = mine.some((c) => c.occurrenceDate === today);
      const thisWeek = mine.filter(
        (c) => c.occurrenceDate >= weekStart && c.occurrenceDate !== today,
      ).length;
      return { quest, doneToday, due: isDueOn(quest.repeat!, today, thisWeek) };
    })
    .filter((d) => d.due || d.doneToday)
    .map(({ quest, doneToday }) => ({ quest, doneToday }));

  const sides = active.filter((q) => q.type === "side").slice(0, MAX_SIDE_QUESTS);

  const liveQuestlines = questlines.filter((q) => q.status === "active").slice(0, MAX_QUESTLINES);

  return {
    boss,
    questlines: liveQuestlines,
    dailies,
    sides,
    isEmpty: quests.length === 0 && questlines.length === 0,
  };
}
