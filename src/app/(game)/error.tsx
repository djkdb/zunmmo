"use client";

import { useEffect } from "react";

import { EmptyState } from "@/components/game/EmptyState";
import { PixelButton } from "@/components/pixel/PixelButton";

/** Error state for every game screen: GM line + retry (UI_GUIDE §8). Never blames the player. */
export default function GameError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="py-12">
      <EmptyState
        icon="ui-gm"
        message="길이 잠깐 막혔어. 다시 한 번 가 보자."
        action={
          <PixelButton variant="primary" onClick={() => retry()}>
            다시 시도
          </PixelButton>
        }
      />
    </div>
  );
}
