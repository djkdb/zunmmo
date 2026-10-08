import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { DayAgenda } from "@/features/calendar/components/DayAgenda";
import { DayCell } from "@/features/calendar/components/DayCell";
import { calendarHref } from "@/features/calendar/href";
import {
  type CalendarView,
  dayItems,
  dayMarkers,
  describeDay,
  monthGrid,
  shiftMonth,
  weekDates,
} from "@/features/calendar/model";
import { listSchedules } from "@/features/calendar/queries";
import { playerToday, requireCharacter } from "@/features/player/queries";
import { listCompletionsSince } from "@/features/progress/queries";
import { listQuests } from "@/features/quests/queries";
import { type GameDate, WEEKDAYS, addDays, weekdayLabel } from "@/lib/game";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "캘린더" };

function parseDate(value: string | string[] | undefined, fallback: GameDate): GameDate {
  return typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value))
    ? value
    : fallback;
}

async function Calendar({
  searchParams,
}: {
  searchParams: PageProps<"/calendar">["searchParams"];
}) {
  const params = await searchParams;
  const player = await requireCharacter();
  const today = playerToday(player);
  const view: CalendarView = params.view === "month" ? "month" : "week";
  const selected = parseDate(params.d, today);

  const grid =
    view === "month"
      ? monthGrid(selected)
      : [weekDates(selected).map((date) => ({ date, inMonth: true }))];
  const from = grid[0]![0]!.date;
  const to = grid.at(-1)!.at(-1)!.date;
  const [quests, schedules, completions] = await Promise.all([
    listQuests(today),
    listSchedules(player, from, to),
    listCompletionsSince(from),
  ]);
  const data = { quests, schedules, completions };
  const cell = (date: GameDate) => {
    const items = dayItems(date, today, data);
    return { items, ...dayMarkers(items), summary: describeDay(items) };
  };

  const prev = view === "month" ? shiftMonth(selected, -1) : addDays(selected, -7);
  const next = view === "month" ? shiftMonth(selected, 1) : addDays(selected, 7);
  const [year, month] = selected.split("-").map(Number);

  return (
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-12">
      <div className="flex flex-col gap-4">
        {params.added && (
          <p role="status" className="text-small text-success-text">
            일정을 추가했어요.
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <Link
              href={calendarHref(view, prev)}
              scroll={false}
              aria-label={view === "month" ? "이전 달" : "이전 주"}
              className="inline-flex size-11 items-center justify-center rounded-sm text-text-secondary hover:bg-surface-raised"
            >
              ←
            </Link>
            <p className="min-w-28 text-center font-pixel text-pixel" aria-live="polite">
              {year}년 {month}월
            </p>
            <Link
              href={calendarHref(view, next)}
              scroll={false}
              aria-label={view === "month" ? "다음 달" : "다음 주"}
              className="inline-flex size-11 items-center justify-center rounded-sm text-text-secondary hover:bg-surface-raised"
            >
              →
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {selected !== today && (
              <Link
                href={calendarHref(view, today)}
                scroll={false}
                className="inline-flex min-h-11 items-center px-2 text-small text-primary-text hover:underline"
              >
                오늘
              </Link>
            )}
            <nav aria-label="보기 방식" className="flex rounded-sm border border-border">
              {(
                [
                  ["week", "주"],
                  ["month", "월"],
                ] as const
              ).map(([v, label]) => (
                <Link
                  key={v}
                  href={calendarHref(v, selected)}
                  scroll={false}
                  aria-current={view === v ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 min-w-11 items-center justify-center px-3 text-small font-semibold",
                    view === v ? "bg-surface-raised text-text" : "text-text-muted hover:text-text",
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {view === "week" ? (
          <ol className="grid grid-cols-7 gap-1">
            {grid[0]!.map(({ date }, i) => {
              const c = cell(date);
              return (
                <li key={date}>
                  <DayCell
                    date={date}
                    href={calendarHref("week", date)}
                    today={date === today}
                    selected={date === selected}
                    weekday={weekdayLabel(i + 1)}
                    summary={c.summary}
                    markers={c.markers}
                    extra={c.extra}
                  />
                </li>
              );
            })}
          </ol>
        ) : (
          <div role="grid" aria-label={`${year}년 ${month}월`} className="flex flex-col gap-1">
            <div role="row" className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((d) => (
                <span
                  key={d}
                  role="columnheader"
                  className="text-center text-caption text-text-muted"
                >
                  {weekdayLabel(d)}
                </span>
              ))}
            </div>
            {grid.map((week) => (
              <div key={week[0]!.date} role="row" className="grid grid-cols-7 gap-1">
                {week.map(({ date, inMonth }) => {
                  const c = cell(date);
                  return (
                    <div key={date} role="gridcell">
                      <DayCell
                        date={date}
                        href={calendarHref("month", date)}
                        today={date === today}
                        selected={date === selected}
                        muted={!inMonth}
                        summary={c.summary}
                        markers={c.markers}
                        extra={c.extra}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-text-muted" aria-hidden>
          <span className="flex items-center gap-1.5">
            <span className="pixel-marker" data-kind="boss" /> 보스 마감
          </span>
          <span className="flex items-center gap-1.5">
            <span className="pixel-marker" data-kind="main" />
            <span className="pixel-marker" data-kind="side" /> 메인·사이드 마감
          </span>
          <span className="flex items-center gap-1.5">
            <span className="pixel-marker" data-kind="schedule" /> 일정
          </span>
          <span className="flex items-center gap-1.5">
            <span className="pixel-marker" data-kind="done" /> 완료
          </span>
        </p>
      </div>

      <DayAgenda date={selected} today={today} items={cell(selected).items} />
    </div>
  );
}

export default function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="font-pixel text-pixel text-text-muted">CALENDAR</p>
        <h1 className="text-h1">캘린더</h1>
      </header>
      <Suspense fallback={<div aria-hidden className="pixel-skeleton h-96 w-full" />}>
        <Calendar searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
