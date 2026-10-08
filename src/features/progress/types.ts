import type { OutfitPreset } from "@/components/game/character/CharacterSprite";
import type { Rarity } from "@/lib/game";

/** What a quest completion produced, for the reward beats (GameEffects). */
export interface CompletionOutcome {
  questId: string;
  questTitle: string;
  /** For the level-up scene. */
  character: { name: string; outfit: OutfitPreset };
  xpChange: number;
  totalXpBefore: number;
  totalXpAfter: number;
  levelUp: { from: number; to: number } | null;
  goalClear: { title: string; bonus: number } | null;
  achievements: Array<{ id: string; name: string; rarity: Rarity; icon: string }>;
}
