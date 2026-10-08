"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { PixelIcon } from "@/components/pixel/PixelIcon";
import { useToast } from "@/components/ui/Toast";
import { useGameEffects } from "@/features/progress/components/GameEffects";
import { cn } from "@/lib/utils/cn";

import { addToAdventure, removeFromAdventure } from "../actions";

/**
 * Take a quest out of today's adventure, or add one the GM left out. The panel heading takes
 * focus afterwards because the row the button lived in may be gone.
 */
export function PlanEditButton({
  kind,
  questId,
  questTitle,
}: {
  kind: "remove" | "add";
  questId: string;
  questTitle: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const { announce } = useGameEffects();
  const [pending, startTransition] = useTransition();

  function run() {
    if (pending) return;
    startTransition(async () => {
      const result =
        kind === "remove" ? await removeFromAdventure(questId) : await addToAdventure(questId);
      if (!result.ok) {
        toast({ tone: "danger", message: result.error.message });
        return;
      }
      announce(
        kind === "remove"
          ? `오늘의 모험에서 뺐어요: ${questTitle}`
          : `오늘의 모험에 담았어요: ${questTitle}`,
      );
      router.refresh();
      document.getElementById("today-title")?.focus();
    });
  }

  return kind === "remove" ? (
    <button
      type="button"
      onClick={run}
      aria-disabled={pending || undefined}
      aria-label={`오늘의 모험에서 빼기: ${questTitle}`}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-sm text-on-parchment-muted hover:bg-parchment-divider",
        pending && "opacity-50",
      )}
    >
      <PixelIcon name="ui-close" />
    </button>
  ) : (
    <button
      type="button"
      onClick={run}
      aria-disabled={pending || undefined}
      aria-label={`오늘의 모험에 담기: ${questTitle}`}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center gap-1 rounded-sm border border-on-parchment-muted px-3 text-small font-semibold text-on-parchment hover:bg-parchment-divider",
        pending && "opacity-50",
      )}
    >
      <PixelIcon name="ui-plus" />
      담기
    </button>
  );
}
