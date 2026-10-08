import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Button } from "@/components/ui/Button";
import { deleteSchedule, skipOccurrence, updateSchedule } from "@/features/calendar/actions";
import { ScheduleForm } from "@/features/calendar/components/ScheduleForm";
import { getScheduleSeries } from "@/features/calendar/queries";
import { describeRecurrence } from "@/features/calendar/recurrence";
import { playerToday, requireCharacter } from "@/features/player/queries";
import { listQuests } from "@/features/quests/queries";
import { formatGameDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "일정 수정" };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

async function EditSchedule({
  params,
  searchParams,
}: {
  params: PageProps<"/calendar/schedules/[id]">["params"];
  searchParams: PageProps<"/calendar/schedules/[id]">["searchParams"];
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const player = await requireCharacter();
  const today = playerToday(player);
  const [series, quests] = await Promise.all([getScheduleSeries(player, id), listQuests(today)]);
  if (!series) notFound();
  // The occurrence the player came from (a weekly series can skip just that one).
  const occurrence = typeof query.d === "string" && ISO_DATE.test(query.d) ? query.d : series.date;

  return (
    <div className="flex flex-col gap-8">
      {series.repeat && (
        <p className="rounded-sm border border-border bg-surface p-4 text-small text-text-secondary">
          {describeRecurrence(series.repeat.weekdays, series.repeat.until)} 반복 일정이에요. 여기서
          바꾸면 모든 회차에 적용돼요.
        </p>
      )}
      <ScheduleForm
        action={updateSchedule.bind(null, series.id)}
        date={series.date}
        quests={quests
          .filter((q) => q.status === "active" && q.type !== "daily")
          .map((q) => ({ id: q.id, title: q.title }))}
        initial={{
          title: series.title,
          date: series.date,
          startTime: series.startTime,
          endTime: series.endTime,
          allDay: series.allDay,
          location: series.location,
          questId: series.questId,
          repeat: series.repeat,
        }}
        submitLabel="저장"
      />
      <section
        aria-labelledby="schedule-delete"
        className="flex flex-col gap-3 border-t border-border pt-6"
      >
        <h2 id="schedule-delete" className="text-small font-semibold text-text-secondary">
          삭제
        </h2>
        <div className="flex flex-wrap gap-3">
          {series.repeat && (
            <form action={skipOccurrence.bind(null, series.id, occurrence)}>
              <Button type="submit">{formatGameDate(occurrence)}만 건너뛰기</Button>
            </form>
          )}
          <form action={deleteSchedule.bind(null, series.id, occurrence)}>
            <Button type="submit" variant="danger">
              {series.repeat ? "반복 일정 전체 삭제" : "일정 삭제"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}

export default function EditSchedulePage({
  params,
  searchParams,
}: PageProps<"/calendar/schedules/[id]">) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <Link
        href="/calendar"
        className="inline-flex min-h-11 items-center self-start text-small text-primary-text hover:underline"
      >
        ← 캘린더
      </Link>
      <header className="flex flex-col gap-1">
        <p className="font-pixel text-pixel text-text-muted">EDIT SCHEDULE</p>
        <h1 className="text-h1">일정 수정</h1>
      </header>
      <Suspense fallback={<div aria-hidden className="pixel-skeleton h-96 w-full" />}>
        <EditSchedule params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
