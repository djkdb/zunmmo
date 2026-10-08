"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { PixelIcon } from "@/components/pixel/PixelIcon";
import { cn } from "@/lib/utils/cn";

import { NAV_ITEMS, activeHref } from "./nav-items";

/** Desktop sidebar (UI_GUIDE §1.2). */
export function SideNav() {
  const active = activeHref(usePathname());
  const links = NAV_ITEMS.filter((i) => !i.primary);
  const add = NAV_ITEMS.find((i) => i.primary);
  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col gap-6 border-r-2 border-outline bg-surface px-4 py-6 lg:flex"
    >
      <Link href="/adventure" className="flex min-h-11 items-center gap-2 px-2">
        <PixelIcon name="ui-sword" />
        <span className="font-pixel text-pixel-2x">LIFE RPG</span>
      </Link>
      <ul className="flex flex-col gap-1">
        {links.map((item) => {
          const isActive = active === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 border-l-4 px-3 text-body",
                  isActive
                    ? "border-accent bg-surface-raised text-text"
                    : "border-transparent text-text-muted hover:bg-surface-raised hover:text-text",
                )}
              >
                <PixelIcon name={item.icon} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      {add && (
        <Link
          href={add.href}
          className="pixel-btn mt-auto inline-flex min-h-11 items-center justify-center gap-2 font-pixel text-pixel uppercase"
          data-variant="primary"
        >
          <PixelIcon name="ui-plus" />
          퀘스트 추가
        </Link>
      )}
      <Link
        href="/settings"
        aria-current={active === "/settings" ? "page" : undefined}
        className="flex min-h-11 items-center gap-3 px-3 text-small text-text-muted hover:text-text"
      >
        <PixelIcon name="ui-settings" />
        설정
      </Link>
    </nav>
  );
}
