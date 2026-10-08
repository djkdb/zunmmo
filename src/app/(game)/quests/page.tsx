import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { EmptyState } from "@/components/game/EmptyState";
import { QuestCard } from "@/components/game/QuestCard";
import { QUEST_TYPE_META } from "@/components/game/quest-meta";
import { QuestListSkeleton } from "@/features/quests/components/QuestListSkeleton";
import { listQuests } from "@/features/quests/queries";
import { CREATABLE_TYPES, type CreatableType } from "@/features/quests/schemas";
import { toCardData } from "@/features/quests/view";
import { playerToday, requireCharacter } from "@/features/player/queries";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "퀘스트" };

type Filter = "all" | CreatableType | "archived";

function parseFilter(value: string | string[] | undefined): Filter {
  if (value === "archived") return "archived";
  return (CREATABLE_TYPES as readonly string[]).includes(String(value))
    ? (value as CreatableType)
    : "all";
}

const FILTERS: ReadonlyArray<{ value: Filter; label: string }> = [
  { value: "all", label: "전체" },
  ...CREATABLE_TYPES.map((t) => ({ value: t, label: QUEST_TYPE_META[t].label })),
  { value: "archived", label: "보관함" },
];

async function QuestBoard({
  searchParams,
}: {
  searchParams: PageProps<"/quests">["searchParams"];
}) {
  const params = await searchParams;
  const filter = parseFilter(params.type);
  const player = await requireCharacter();
  const today = playerToday(player);
  const quests = await listQuests(today, { archived: filter === "archived" });
  const shown =
    filter === "all" || filter === "archived" ? quests : quests.filter((q) => q.type === filter);
  const open = shown.filter(
    (q) => q.status === "active" || q.status === "expired" || q.status === "archived",
  );
  const done = shown.filter((q) => q.status === "completed");

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="퀘스트 종류" className="-mx-4 overflow-x-auto px-4">
        <ul className="flex gap-2">
          {FILTERS.map((f) => (
            <li key={f.value}>
              <Link
                href={f.value === "all" ? "/quests" : `/quests?type=${f.value}`}
                aria-current={filter === f.value ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-sm border px-3 font-pixel text-pixel whitespace-nowrap",
                  filter === f.value
                    ? "border-accent bg-surface-raised text-text"
                    : "border-border text-text-muted hover:text-text",
                )}
              >
                {f.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {params.created && (
        <p role="status" className="font-pixel text-pixel text-xp-text">
          퀘스트를 게시판에 올렸어!
        </p>
      )}
      {params.archived && (
        <p role="status" className="text-small text-text-muted">
          퀘스트를 보관함으로 옮겼어요.
        </p>
      )}

      {open.length === 0 && done.length === 0 ? (
        <EmptyState
          icon={filter === "archived" ? "ui-quests" : "quest-side"}
          message={
            filter === "archived"
              ? "보관한 퀘스트가 없어."
              : "아직 이 게시판엔 퀘스트가 없어. 하나 올려 볼까?"
          }
          action={
            filter === "archived" ? undefined : (
              <Link
                href={filter === "all" ? "/quests/new" : `/quests/new?type=${filter}`}
                className="pixel-btn inline-flex min-h-11 items-center px-5 font-pixel text-pixel uppercase"
                data-variant="accent"
              >
                퀘스트 추가
              </Link>
            )
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-5">
            {open.map((q) => (
              <li key={q.id}>
                <QuestCard quest={toCardData(q)} today={today} href={`/quests/${q.id}`} />
              </li>
            ))}
          </ul>
          {done.length > 0 && (
            <details className="flex flex-col gap-4">
              <summary className="flex min-h-11 cursor-pointer items-center text-small font-semibold text-text-muted">
                완료한 퀘스트 {done.length}개
              </summary>
              <ul className="mt-4 flex flex-col gap-5">
                {done.map((q) => (
                  <li key={q.id}>
                    <QuestCard quest={toCardData(q)} today={today} href={`/quests/${q.id}`} />
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </div>
  );
}

export default function QuestsPage({ searchParams }: PageProps<"/quests">) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="font-pixel text-pixel text-text-muted">QUEST BOARD</p>
          <h1 className="text-h1">퀘스트</h1>
        </div>
        <Link
          href="/quests/new"
          className="hidden min-h-11 items-center rounded-sm border border-border-strong px-4 text-small font-semibold hover:bg-surface-raised sm:inline-flex"
        >
          + 퀘스트 추가
        </Link>
      </header>
      <Suspense fallback={<QuestListSkeleton />}>
        <QuestBoard searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
