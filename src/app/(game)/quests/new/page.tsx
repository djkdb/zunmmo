import type { Metadata } from "next";
import { Suspense } from "react";

import { createQuest } from "@/features/quests/actions";
import { QuestForm } from "@/features/quests/components/QuestForm";
import { TemplatePicker } from "@/features/quests/components/TemplatePicker";
import { listQuestlineOptions } from "@/features/quests/queries";
import { CREATABLE_TYPES, type CreatableType } from "@/features/quests/schemas";
import { playerToday, requireCharacter } from "@/features/player/queries";
import { templateById, templateStat } from "@/lib/game";

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
  const template = typeof params.template === "string" ? templateById(params.template) : undefined;
  const player = await requireCharacter();
  const questlines = await listQuestlineOptions();
  const initial = template
    ? {
        title: template.title,
        type: template.type,
        difficulty: template.difficulty,
        primaryStat: templateStat(template),
        estimatedMinutes: template.estimatedMinutes ?? null,
        repeat: template.repeat ?? null,
      }
    : type
      ? { type }
      : undefined;
  return (
    <>
      <TemplatePicker selected={template?.id} />
      <QuestForm
        // Remount when the template changes so its defaults apply.
        key={template?.id ?? type ?? "blank"}
        action={createQuest}
        today={playerToday(player)}
        questlines={questlines}
        initial={initial}
        submitLabel="게시판에 올리기"
      />
    </>
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
