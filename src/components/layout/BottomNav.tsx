"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { PixelIcon } from "@/components/pixel/PixelIcon";
import { cn } from "@/lib/utils/cn";

import { NAV_ITEMS, activeHref } from "./nav-items";

/** Mobile tab bar (UI_GUIDE §1.1): 5 tabs, raised center "add quest", safe-area aware. */
export function BottomNav() {
  const active = activeHref(usePathname());
  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-outline bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-lg grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.href;
          if (item.primary) {
            return (
              <li key={item.href} className="flex items-start justify-center">
                <Link
                  href={item.href}
                  aria-label="퀘스트 추가"
                  aria-current={isActive ? "page" : undefined}
                  className="pixel-btn -mt-3 flex size-14 items-center justify-center"
                  data-variant="accent"
                >
                  <PixelIcon name={item.icon} />
                </Link>
              </li>
            );
          }
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 text-caption",
                  isActive ? "text-text" : "text-text-muted hover:text-text-secondary",
                )}
              >
                <PixelIcon name={item.icon} />
                <span>{item.label}</span>
                <span
                  aria-hidden
                  className={cn("h-1 w-4", isActive ? "bg-accent" : "bg-transparent")}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
