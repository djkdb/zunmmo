import type { QuestView } from "../queries";
import { QuestCompleteButton } from "./QuestCompleteButton";

/**
 * The completion control a quest gets on any list: open quests can be completed (expired ones
 * too — "다시 도전"), and today's completions can be undone. Older completions are history.
 */
export function QuestAction({ quest, doneToday }: { quest: QuestView; doneToday: boolean }) {
  if (quest.status === "archived") return null;
  if (quest.status === "completed" && !doneToday) return null;
  return (
    <QuestCompleteButton
      questId={quest.id}
      questTitle={quest.title}
      xp={quest.xp}
      completed={quest.type === "daily" ? doneToday : quest.status === "completed"}
    />
  );
}
