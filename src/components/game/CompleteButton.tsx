"use client";

import { PixelIcon } from "@/components/pixel/PixelIcon";
import { cn } from "@/lib/utils/cn";

interface CompleteButtonProps {
  questTitle: string;
  completed: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

/**
 * 44×44 pixel completion button. Completing never asks for confirmation —
 * mistakes are undone from the toast (UI_GUIDE §5.3).
 */
export function CompleteButton({ questTitle, completed, onToggle, disabled }: CompleteButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={completed}
      aria-label={completed ? `완료 취소: ${questTitle}` : `퀘스트 완료: ${questTitle}`}
      // aria-disabled, not disabled: a disabled button drops keyboard focus mid-action, and the
      // same button is how keyboard users undo (P5).
      onClick={() => {
        if (!disabled) onToggle();
      }}
      aria-disabled={disabled || undefined}
      className={cn("pixel-btn size-11 shrink-0 items-center justify-center", "inline-flex")}
      data-variant={completed ? "primary" : undefined}
      data-pressed={completed ? "" : undefined}
    >
      <span className={cn(!completed && "opacity-25")}>
        <PixelIcon name="ui-check" scale={2} />
      </span>
    </button>
  );
}
