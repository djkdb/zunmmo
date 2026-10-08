import type { IconName } from "@/components/pixel/icons.generated";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** The raised center action on mobile (UI_GUIDE §1.1). */
  primary?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/adventure", label: "모험", icon: "ui-adventure" },
  { href: "/quests", label: "퀘스트", icon: "ui-quests" },
  { href: "/quests/new", label: "추가", icon: "ui-plus", primary: true },
  { href: "/calendar", label: "캘린더", icon: "ui-calendar" },
  { href: "/character", label: "캐릭터", icon: "ui-character" },
];

/** Most specific match wins so /quests/new highlights "추가", not "퀘스트". */
export function activeHref(pathname: string, items: readonly NavItem[] = NAV_ITEMS): string | null {
  const matches = items.filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));
  return matches.sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null;
}
