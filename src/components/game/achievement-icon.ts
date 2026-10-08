import { ICON_ATLAS, type IconName } from "@/components/pixel/icons.generated";

const NAMES: readonly string[] = ICON_ATLAS.names;

/** Achievement icons are plain strings in lib/game; narrow them to the atlas at the UI edge. */
export function achievementIcon(icon: string): IconName {
  return NAMES.includes(icon) ? (icon as IconName) : "ui-sword";
}
