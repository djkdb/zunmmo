import type { Metadata } from "next";
import { Suspense } from "react";

import { createQuest } from "@/features/quests/actions";
import { QuestForm } from "@/features/quests/components/QuestForm";
import { listQuestlineOptions } from "@/features/quests/queries";
import { CREATABLE_TYPES, type CreatableType } from "@/features/quests/schemas";
import { playerToday, requireCharacter } from "@/features/player/queries";

export const metadata: Metadata = { title: "퀘스트 추가" };

async function NewQuest({
  searchParams,
}: {
  searchParams: PageProps<"/quests/new">["searchParams"];
}) {
  const params = await searchParams;
  const type = (CREATABLE_TYPES as readonly string[]).includes(String(params.type))
    ? (params.type as CreatableType)
    : undefined;
  const player = await requireCharacter();
  const questlines = await listQuestlineOptions();
  return (
    <QuestForm
      action={createQuest}
      today={playerToday(player)}
      questlines={questlines}
      initial={type ? { type } : undefined}
      submitLabel="게시판에 올리기"
    />
  );
}

export default function NewQuestPage({ searchParams }: PageProps<"/quests/new">) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="font-pixel text-pixel text-text-muted">NEW QUEST</p>
        <h1 className="text-h1">퀘스트 추가</h1>
      </header>
      <Suspense fallback={<div aria-hidden className="pixel-skeleton h-96" />}>
        <NewQuest searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
