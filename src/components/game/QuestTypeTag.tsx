import { PixelTag } from "@/components/pixel/PixelTag";
import type { QuestType } from "@/lib/game";

import { QUEST_TYPE_META } from "./quest-meta";

/** Quest type as color + uppercase label; the icon is shown alongside by the card. */
export function QuestTypeTag({ type }: { type: QuestType }) {
  const meta = QUEST_TYPE_META[type];
  return (
    <PixelTag tone={type}>
      <span aria-hidden>{meta.label}</span>
      <span className="sr-only">{meta.ko}</span>
    </PixelTag>
  );
}
