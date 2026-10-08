"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { josa } from "@/lib/game";
import { formatGameDate } from "@/lib/utils/format";

import { retryQuest, stashQuest } from "../actions";

/** "다시 도전" (+7 days) or "보관" for a quest whose deadline passed — no guilt, two taps. */
export function ExpiredQuestActions({
  questId,
  questTitle,
}: {
  questId: string;
  questTitle: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  function run(kind: "retry" | "stash") {
    if (pending) return;
    startTransition(async () => {
      const result = kind === "retry" ? await retryQuest(questId) : await stashQuest(questId);
      if (!result.ok) {
        toast({ tone: "danger", message: result.error.message });
        return;
      }
      toast({
        tone: "success",
        message:
          kind === "retry" && result.data
            ? `${questTitle} — ${formatGameDate(result.data.deadline)}까지 다시 도전!`
            : `${josa(questTitle, "을", "를")} 보관함으로 옮겼어요.`,
      });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        aria-disabled={pending || undefined}
        aria-label={`다시 도전: ${questTitle}`}
        onClick={() => run("retry")}
      >
        다시 도전
      </Button>
      <Button
        variant="ghost"
        aria-disabled={pending || undefined}
        aria-label={`보관: ${questTitle}`}
        onClick={() => run("stash")}
      >
        보관
      </Button>
    </div>
  );
}
