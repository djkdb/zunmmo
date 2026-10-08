import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { QuestCard } from "@/components/game/QuestCard";
import { STAT_META } from "@/components/game/quest-meta";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { Button } from "@/components/ui/Button";
import { setQuestArchived, updateQuest } from "@/features/quests/actions";
import { listCompletionsSince } from "@/features/progress/queries";
import { QuestAction } from "@/features/quests/components/QuestAction";
import { QuestForm } from "@/features/quests/components/QuestForm";
import { getQuest, listQuestlineOptions } from "@/features/quests/queries";
import type { CreatableType } from "@/features/quests/schemas";
import { toCardData } from "@/features/quests/view";
import { playerToday, requireCharacter } from "@/features/player/queries";
import { describeRepeat } from "@/lib/game";
import { formatMinutes } from "@/lib/utils/format";

export const metadata: Metadata = { title: "퀘스트" };

async function QuestDetail({
  params,
  searchParams,
}: {
  params: PageProps<"/quests/[id]">["params"];
  searchParams: PageProps<"/quests/[id]">["searchParams"];
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const player = await requireCharacter();
  const today = playerToday(player);
  const [quest, questlines, completions] = await Promise.all([
    getQuest(id, today),
    listQuestlineOptions(),
    listCompletionsSince(today),
  ]);
  const doneToday = completions.some((c) => c.questId === quest.id);
  const archived = quest.status === "archived";
  const editable = quest.type !== "hidden";

  return (
    <div className="flex flex-col gap-8">
      {query.saved && (
        <p role="status" className="text-small text-success-text">
          저장했어요.
        </p>
      )}
      <QuestCard
        quest={toCardData(quest, { completedToday: doneToday })}
        today={today}
        action={<QuestAction quest={quest} doneToday={doneToday} />}
      />

      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-small">
        <dt className="text-text-muted">성장 스탯</dt>
        <dd className="flex items-center gap-2">
          <PixelIcon name={STAT_META[quest.primaryStat].icon} />
          {STAT_META[quest.primaryStat].label} · {STAT_META[quest.primaryStat].ko}
        </dd>
        {quest.repeat && (
          <>
            <dt className="text-text-muted">반복</dt>
            <dd>{describeRepeat(quest.repeat)}</dd>
          </>
        )}
        {quest.estimatedMinutes && (
          <>
            <dt className="text-text-muted">예상 시간</dt>
            <dd>{formatMinutes(quest.estimatedMinutes)}</dd>
          </>
        )}
        {quest.goal && (
          <>
            <dt className="text-text-muted">퀘스트라인</dt>
            <dd>{quest.goal.title}</dd>
          </>
        )}
        {quest.description && (
          <>
            <dt className="text-text-muted">메모</dt>
            <dd className="whitespace-pre-wrap">{quest.description}</dd>
          </>
        )}
      </dl>

      {editable && !archived && (
        <details className="rounded-sm border border-border p-4">
          <summary className="flex min-h-11 cursor-pointer items-center text-small font-semibold text-text-secondary">
            수정하기
          </summary>
          <div className="mt-6">
            <QuestForm
              action={updateQuest.bind(null, quest.id)}
              today={today}
              questlines={questlines}
              submitLabel="저장"
              initial={{
                title: quest.title,
                description: quest.description,
                type: quest.type as CreatableType,
                difficulty: quest.difficulty,
                primaryStat: quest.primaryStat,
                deadline: quest.deadline,
                estimatedMinutes: quest.estimatedMinutes,
                repeat: quest.repeat,
                goalId: quest.goal?.id ?? null,
              }}
            />
          </div>
        </details>
      )}

      <form action={setQuestArchived.bind(null, quest.id, !archived)}>
        <Button type="submit" variant={archived ? "secondary" : "ghost"}>
          {archived ? "보관함에서 꺼내기" : "보관함으로 옮기기"}
        </Button>
        {!archived && (
          <p className="mt-1 text-caption text-text-muted">
            보관해도 지금까지 얻은 XP 기록은 그대로 남아요.
          </p>
        )}
      </form>
    </div>
  );
}

export default function QuestPage({ params, searchParams }: PageProps<"/quests/[id]">) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <Link
        href="/quests"
        className="inline-flex min-h-11 items-center self-start text-small text-primary-text hover:underline"
      >
        ← 퀘스트 게시판
      </Link>
      <h1 className="sr-only">퀘스트 상세</h1>
      <Suspense fallback={<div aria-hidden className="pixel-skeleton h-48" />}>
        <QuestDetail params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
