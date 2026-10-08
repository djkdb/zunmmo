import type { QuestCardData } from "@/components/game/QuestCard";

import type { QuestView } from "./queries";

/** QuestView → the presentational card's props. */
export function toCardData(
  quest: QuestView,
  options: { completedToday?: boolean } = {},
): QuestCardData {
  return {
    title: quest.title,
    type: quest.type,
    difficulty: quest.difficulty,
    xp: quest.xp,
    deadline: quest.deadline ?? undefined,
    estimatedMinutes: quest.estimatedMinutes ?? undefined,
    completed: quest.status === "completed" || options.completedToday === true,
    expired: quest.status === "expired",
  };
}
