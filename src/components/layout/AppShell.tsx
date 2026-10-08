import type { ReactNode } from "react";

import { BottomNav } from "./BottomNav";
import { SideNav } from "./SideNav";

/** Signed-in chrome. Static (no session read) so it prerenders into the shell. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:pl-60">
      <SideNav />
      <main className="mx-auto w-full max-w-5xl px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pt-10 lg:pb-12">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
