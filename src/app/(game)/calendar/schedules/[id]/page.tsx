import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type ReactNode, Suspense } from "react";

import { Button } from "@/components/ui/Button";
import {
  deleteSchedule,
  editOccurrence,
  restoreOccurrence,
  skipOccurrence,
  updateSchedule,
} from "@/features/calendar/actions";
import { ScheduleForm, type ScheduleFormValues } from "@/features/calendar/components/ScheduleForm";
import { type ScheduleSeriesView, getScheduleSeries } from "@/features/calendar/queries";
import { describeRecurrence } from "@/features/calendar/recurrence";
import { playerToday, requireCharacter } from "@/features/player/queries";
import { listQuests } from "@/features/quests/queries";
import { cn } from "@/lib/utils/cn";
import { formatGameDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "일정 수정" };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

type Scope = "one" | "all";

function formValues(s: ScheduleSeriesView, date = s.date): ScheduleFormValues {
  return {
    title: s.title,
    date,
    startTime: s.startTime,
    endTime: s.endTime,
    allDay: s.allDay,
    location: s.location,
    questId: s.questId,
    repeat: s.repeat,
  };
}

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
  const [schedule, quests] = await Promise.all([getScheduleSeries(player, id), listQuests(today)]);
  if (!schedule) notFound();
  const questOptions = quests
    .filter((q) => q.status === "active" && q.type !== "daily")
    .map((q) => ({ id: q.id, title: q.title }));

  // One occurrence of a series that was changed on its own.
  if (schedule.changed) {
    const series = await getScheduleSeries(player, schedule.changed.seriesId);
    return (
      <div className="flex flex-col gap-8">
        <p className="rounded-sm border border-border bg-surface p-4 text-small text-text-secondary">
          {series
            ? `‘${series.title}’ 반복 일정의 ${formatGameDate(schedule.changed.date)} 회차만 바꾼 일정이에요. 다른 회차는 그대로예요.`
            : "반복 일정에서 이번 회차만 바꾼 일정이에요."}
        </p>
        <ScheduleForm
          action={updateSchedule.bind(null, schedule.id)}
          date={schedule.date}
          quests={questOptions}
          initial={formValues(schedule)}
          submitLabel="저장"
          allowRepeat={false}
        />
        <DangerZone title="되돌리기 · 삭제">
          <form action={restoreOccurrence.bind(null, schedule.id, schedule.changed.date)}>
            <Button type="submit">원래 일정으로 되돌리기</Button>
          </form>
          <form action={deleteSchedule.bind(null, schedule.id, schedule.date)}>
            <Button type="submit" variant="danger">
              이번 회차 삭제
            </Button>
          </form>
        </DangerZone>
      </div>
    );
  }

  if (!schedule.repeat) {
    return (
      <div className="flex flex-col gap-8">
        <ScheduleForm
          action={updateSchedule.bind(null, schedule.id)}
          date={schedule.date}
          quests={questOptions}
          initial={formValues(schedule)}
          submitLabel="저장"
        />
        <DangerZone>
          <form action={deleteSchedule.bind(null, schedule.id, schedule.date)}>
            <Button type="submit" variant="danger">
              일정 삭제
            </Button>
          </form>
        </DangerZone>
      </div>
    );
  }

  // A weekly series, opened from one of its occurrences.
  const occurrence = typeof query.d === "string" && ISO_DATE.test(query.d) ? query.d : null;
  const scope: Scope = occurrence && query.scope === "one" ? "one" : "all";
  const recurrence = describeRecurrence(schedule.repeat.weekdays, schedule.repeat.until);
  const scopeHref = (s: Scope) =>
    `/calendar/schedules/${schedule.id}?d=${occurrence}${s === "one" ? "&scope=one" : ""}`;

  return (
    <div className="flex flex-col gap-8">
      {occurrence && (
        <nav
          aria-label="바꿀 범위"
          className="inline-flex self-start overflow-hidden rounded-sm border border-border"
        >
          {(
            [
              ["one", `${formatGameDate(occurrence)} 회차만`],
              ["all", "모든 회차"],
            ] as const
          ).map(([s, label]) => (
            <Link
              key={s}
              href={scopeHref(s)}
              replace
              scroll={false}
              aria-current={scope === s ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center justify-center px-4 text-small font-semibold",
                scope === s ? "bg-surface-raised text-text" : "text-text-muted hover:text-text",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
      {scope === "one" && occurrence ? (
        <>
          <p className="rounded-sm border border-border bg-surface p-4 text-small text-text-secondary">
            {recurrence} 반복 일정 중 {formatGameDate(occurrence)} 회차만 바꿔요. 날짜를 옮겨도
            돼요.
          </p>
          <ScheduleForm
            key="one"
            action={editOccurrence.bind(null, schedule.id, occurrence)}
            date={occurrence}
            quests={questOptions}
            initial={formValues(schedule, occurrence)}
            submitLabel="이번 회차 저장"
            allowRepeat={false}
          />
        </>
      ) : (
        <>
          <p className="rounded-sm border border-border bg-surface p-4 text-small text-text-secondary">
            {recurrence} 반복 일정이에요. 여기서 바꾸면 모든 회차에 적용돼요.
          </p>
          <ScheduleForm
            key="all"
            action={updateSchedule.bind(null, schedule.id)}
            date={schedule.date}
            quests={questOptions}
            initial={formValues(schedule)}
            submitLabel="저장"
          />
        </>
      )}
      <DangerZone>
        <form action={skipOccurrence.bind(null, schedule.id, occurrence ?? schedule.date)}>
          <Button type="submit">{formatGameDate(occurrence ?? schedule.date)}만 건너뛰기</Button>
        </form>
        <form action={deleteSchedule.bind(null, schedule.id, occurrence ?? schedule.date)}>
          <Button type="submit" variant="danger">
            반복 일정 전체 삭제
          </Button>
        </form>
      </DangerZone>
    </div>
  );
}

function DangerZone({ title = "삭제", children }: { title?: string; children: ReactNode }) {
  return (
    <section
      aria-labelledby="schedule-delete"
      className="flex flex-col gap-3 border-t border-border pt-6"
    >
      <h2 id="schedule-delete" className="text-small font-semibold text-text-secondary">
        {title}
      </h2>
      <div className="flex flex-wrap gap-3">{children}</div>
    </section>
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
