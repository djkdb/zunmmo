import Link from "next/link";

import { PixelIcon } from "@/components/pixel/PixelIcon";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
      <Link href="/" className="flex min-h-11 items-center gap-2" aria-label="LIFE RPG 홈">
        <PixelIcon name="ui-sword" />
        <span className="font-pixel text-pixel-2x text-text">LIFE RPG</span>
      </Link>
      <Link
        href="/login"
        className="inline-flex min-h-11 items-center rounded-sm px-3 text-small font-semibold text-text-secondary hover:bg-surface-raised hover:text-text"
      >
        로그인
      </Link>
    </header>
  );
}
