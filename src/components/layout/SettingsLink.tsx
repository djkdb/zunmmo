import Link from "next/link";

import { PixelIcon } from "@/components/pixel/PixelIcon";

/** Gear in the character header — the mobile route to settings (UI_GUIDE §1.1). */
export function SettingsLink() {
  return (
    <Link
      href="/settings"
      aria-label="설정"
      className="-mt-1 -mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-sm hover:bg-surface-raised lg:hidden"
    >
      <PixelIcon name="ui-settings" />
    </Link>
  );
}
