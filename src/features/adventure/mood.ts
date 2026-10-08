import type { CharacterState } from "@/components/game/character/CharacterSprite";
import type { QuestView } from "@/features/quests/queries";
import { type GameDate, type Stat, daysBetween } from "@/lib/game";

/** What the character is doing about each kind of growth (CHARACTER_GUIDE §5). */
const STAT_STATE: Partial<Record<Stat, CharacterState>> = {
  int: "studying",
  foc: "working",
  vit: "exercising",
};

/**
 * The dashboard character while an adventure is under way: running when the next step is a
 * boss due today or tomorrow, otherwise acting out the next step's stat, else walking on.
 */
export function adventureMood(next: QuestView | undefined, today: GameDate): CharacterState {
  if (!next) return "walking";
  if (next.type === "boss" && next.deadline && daysBetween(today, next.deadline) <= 1)
    return "running";
  return STAT_STATE[next.primaryStat] ?? "walking";
}
