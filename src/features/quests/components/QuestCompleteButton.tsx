"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { CompleteButton } from "@/components/game/CompleteButton";
import { useToast } from "@/components/ui/Toast";
import { useGameEffects } from "@/features/progress/components/GameEffects";
import { formatXpGain } from "@/lib/utils/format";

import { completeQuest, uncompleteQuest } from "../actions";

interface QuestCompleteButtonProps {
  questId: string;
  questTitle: string;
  xp: number;
  completed: boolean;
}

/**
 * Optimistic completion: the check lands immediately, the server grants XP, and the
 * toast offers Undo instead of a confirmation dialog (UI_GUIDE §5.3).
 */
export function QuestCompleteButton({
  questId,
  questTitle,
  xp,
  completed,
}: QuestCompleteButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const { celebrate, announce } = useGameEffects();
  const [pending, startTransition] = useTransition();
  // Local state instead of useOptimistic: the server answer and router.refresh() land in
  // separate renders, and the check must not flicker back in between.
  const [optimistic, setOptimistic] = useState(completed);
  const [seen, setSeen] = useState(completed);
  if (seen !== completed) {
    setSeen(completed);
    setOptimistic(completed);
  }
  // Each completion gets a fresh float so repeated taps restart the animation.
  const [floatKey, setFloatKey] = useState<number | null>(null);

  function undo() {
    startTransition(async () => {
      setOptimistic(false);
      const result = await uncompleteQuest(questId);
      if (!result.ok) {
        setOptimistic(true);
        toast({ tone: "danger", message: result.error.message });
        router.refresh();
        return;
      }
      announce(`완료를 취소했어요. ${formatXpGain(result.data.xpChange)}`);
      router.refresh();
    });
  }

  function complete() {
    startTransition(async () => {
      setOptimistic(true);
      setFloatKey(Date.now());
      const result = await completeQuest(questId);
      if (!result.ok) {
        setOptimistic(false);
        setFloatKey(null);
        toast({ tone: "danger", message: result.error.message });
        router.refresh();
        return;
      }
      celebrate(result.data);
      toast({
        message: `${questTitle} 완료 ${formatXpGain(result.data.xpChange)}`,
        action: { label: "되돌리기", onClick: undo },
      });
      router.refresh();
    });
  }

  return (
    <span className="relative inline-flex">
      <CompleteButton
        questTitle={questTitle}
        completed={optimistic}
        disabled={pending}
        onToggle={optimistic ? undo : complete}
      />
      {floatKey !== null && optimistic && (
        <span
          key={floatKey}
          aria-hidden
          onAnimationEnd={() => setFloatKey(null)}
          className="pixel-xp-float absolute right-0 bottom-full mb-1 font-pixel text-pixel whitespace-nowrap text-xp-text"
        >
          {formatXpGain(xp)}
        </span>
      )}
    </span>
  );
}
