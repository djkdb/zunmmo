import type { ReactNode } from "react";

import { PixelIcon } from "@/components/pixel/PixelIcon";
import type { IconName } from "@/components/pixel/icons.generated";
import { cn } from "@/lib/utils/cn";

/** Empty state: art + one sentence + one action (UI_GUIDE §8). Copy is the GM speaking (반말). */
export function EmptyState({
  icon,
  message,
  action,
  surface = "dark",
  className,
}: {
  icon: IconName;
  message: string;
  action?: ReactNode;
  /** Background it sits on — parchment needs dark ink (COLOR_PALETTE §4). */
  surface?: "dark" | "parchment";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-4 px-4 py-8 text-center", className)}>
      <PixelIcon name={icon} scale={3} />
      <p
        className={cn(
          "max-w-xs text-body",
          surface === "parchment" ? "text-on-parchment-muted" : "text-text-secondary",
        )}
      >
        {message}
      </p>
      {action}
    </div>
  );
}
