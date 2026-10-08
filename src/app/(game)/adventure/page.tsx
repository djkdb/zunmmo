import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { CharacterHeader } from "@/components/game/CharacterHeader";
import { EmptyState } from "@/components/game/EmptyState";
import { SettingsLink } from "@/components/layout/SettingsLink";
import { PixelFrame } from "@/components/pixel/PixelFrame";
import { AdventureSkeleton } from "@/features/adventure/components/AdventureSkeleton";
import { requireCharacter } from "@/features/player/queries";

export const metadata: Metadata = { title: "모험" };

async function Adventure() {
  const { character } = await requireCharacter();
  return (
    <div className="flex flex-col gap-8">
      <CharacterHeader
        name={character.name}
        outfit={character.outfit}
        totalXp={character.totalXp}
        action={<SettingsLink />}
      />
      <PixelFrame variant="parchment">
        <EmptyState
          icon="ui-quests"
          surface="parchment"
          message="퀘스트 게시판이 비어 있어. 첫 퀘스트를 올려 볼까?"
          action={
            <Link
              href="/quests/new"
              className="pixel-btn inline-flex min-h-11 items-center px-5 font-pixel text-pixel uppercase"
              data-variant="accent"
            >
              퀘스트 추가
            </Link>
          }
        />
      </PixelFrame>
    </div>
  );
}

export default function AdventurePage() {
  return (
    <>
      <h1 className="sr-only">오늘의 모험</h1>
      <Suspense fallback={<AdventureSkeleton />}>
        <Adventure />
      </Suspense>
    </>
  );
}
