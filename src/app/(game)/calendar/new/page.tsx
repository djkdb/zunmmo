import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ScheduleForm } from "@/features/calendar/components/ScheduleForm";
import { playerToday, requireCharacter } from "@/features/player/queries";
import { listQuests } from "@/features/quests/queries";

export const metadata: Metadata = { title: "일정 추가" };

async function NewSchedule({
  searchParams,
}: {
  searchParams: PageProps<"/calendar/new">["searchParams"];
}) {
  const params = await searchParams;
  const player = await requireCharacter();
  const today = playerToday(player);
  const date =
    typeof params.d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.d) ? params.d : today;
  const quests = (await listQuests(today)).filter(
    (q) => q.status === "active" && q.type !== "daily",
  );
  return <ScheduleForm date={date} quests={quests.map((q) => ({ id: q.id, title: q.title }))} />;
}

export default function NewSchedulePage({ searchParams }: PageProps<"/calendar/new">) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <Link
        href="/calendar"
        className="inline-flex min-h-11 items-center self-start text-small text-primary-text hover:underline"
      >
        ← 캘린더
      </Link>
      <header className="flex flex-col gap-1">
        <p className="font-pixel text-pixel text-text-muted">NEW SCHEDULE</p>
        <h1 className="text-h1">일정 추가</h1>
        <p className="text-small text-text-muted">
          고정된 일정은 그날 오늘의 모험 추천 시간에서 빠져요.
        </p>
      </header>
      <Suspense fallback={<div aria-hidden className="pixel-skeleton h-96 w-full" />}>
        <NewSchedule searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
