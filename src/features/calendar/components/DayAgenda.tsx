import Link from "next/link";
import type { ReactNode } from "react";

import { QuestTypeTag } from "@/components/game/QuestTypeTag";
import { EmptyState } from "@/components/game/EmptyState";
import { QuestAction } from "@/features/quests/components/QuestAction";
import { Button } from "@/components/ui/Button";
import { type GameDate, isoWeekday, weekdayLabel } from "@/lib/game";
import { formatGameDate, formatXpGain } from "@/lib/utils/format";

import { deleteSchedule } from "../actions";
import type { DayItems } from "../model";

/** The selected day as an agenda: all-day items, then timed blocks, then what got done. */
export function DayAgenda({
  date,
  today,
  items,
}: {
  date: GameDate;
  today: GameDate;
  items: DayItems;
}) {
  const allDay = items.schedules.filter((s) => s.allDay);
  const timed = items.schedules.filter((s) => !s.allDay);
  const isEmpty =
    !items.deadlines.length &&
    !items.dailies.length &&
    !items.schedules.length &&
    !items.completed.length;
  // Completion always lands on today's game date, so only today's agenda can complete.
  const isToday = date === today;
  const heading = `${formatGameDate(date)} (${weekdayLabel(isoWeekday(date))})${date === today ? " · 오늘" : ""}`;

  return (
    <section aria-labelledby="agenda-title" className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="agenda-title" className="text-h2">
          {heading}
        </h2>
        <Link
          href={`/calendar/new?d=${date}`}
          className="pixel-btn inline-flex min-h-11 items-center px-4 font-pixel text-pixel uppercase"
        >
          + 일정
        </Link>
      </div>

      {isEmpty ? (
        <EmptyState icon="ui-calendar" message="이날은 비어 있어. 일정이나 퀘스트를 올려 볼까?" />
      ) : (
        <>
          {(items.deadlines.length > 0 || allDay.length > 0 || items.dailies.length > 0) && (
            <div className="flex flex-col gap-2">
              <h3 className="text-small font-semibold text-text-secondary">하루 종일</h3>
              <ul className="flex flex-col">
                {items.deadlines.map((q) => (
                  <AgendaRow key={q.id}>
                    <QuestTypeTag type={q.type} />
                    <Link
                      href={`/quests/${q.id}`}
                      className="min-w-0 flex-1 truncate hover:underline"
                    >
                      {q.title}
                    </Link>
                    <span className="text-caption text-text-muted">
                      마감 · {formatXpGain(q.xp)}
                    </span>
                    {isToday && <QuestAction quest={q} doneToday={false} />}
                  </AgendaRow>
                ))}
                {allDay.map((s) => (
                  <AgendaRow key={s.id}>
                    <span className="font-pixel text-pixel text-text-muted">일정</span>
                    <span className="min-w-0 flex-1 truncate">{s.title}</span>
                    <DeleteSchedule id={s.id} date={date} title={s.title} />
                  </AgendaRow>
                ))}
                {items.dailies.map((q) => (
                  <AgendaRow key={q.id}>
                    <QuestTypeTag type="daily" />
                    <Link
                      href={`/quests/${q.id}`}
                      className="min-w-0 flex-1 truncate hover:underline"
                    >
                      {q.title}
                    </Link>
                    {isToday && <QuestAction quest={q} doneToday={false} />}
                  </AgendaRow>
                ))}
              </ul>
            </div>
          )}

          {timed.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-small font-semibold text-text-secondary">일정</h3>
              <ul className="flex flex-col gap-2">
                {timed.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-stretch gap-3 rounded-sm border border-border bg-surface p-3"
                  >
                    <span className="w-24 shrink-0 font-pixel text-pixel text-text-secondary">
                      {s.startTime}
                      {s.endTime && (
                        <>
                          <br />
                          <span className="text-text-muted">~{s.endTime}</span>
                        </>
                      )}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-body font-semibold">{s.title}</span>
                      {s.location && (
                        <span className="text-caption text-text-muted">{s.location}</span>
                      )}
                      {s.quest && (
                        <Link
                          href={`/quests/${s.quest.id}`}
                          className="text-caption text-primary-text hover:underline"
                        >
                          퀘스트: {s.quest.title}
                        </Link>
                      )}
                    </div>
                    <DeleteSchedule id={s.id} date={date} title={s.title} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {items.completed.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-small font-semibold text-text-secondary">완료</h3>
              <ul className="flex flex-col">
                {items.completed.map((q) => (
                  <AgendaRow key={q.id}>
                    <span className="pixel-marker" data-kind="done" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-text-secondary">{q.title}</span>
                    <span className="font-pixel text-pixel text-xp-text">{formatXpGain(q.xp)}</span>
                    {isToday && <QuestAction quest={q} doneToday />}
                  </AgendaRow>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function AgendaRow({ children }: { children: ReactNode }) {
  return (
    <li className="flex min-h-12 items-center gap-3 border-b border-border py-2 text-small last:border-b-0">
      {children}
    </li>
  );
}

function DeleteSchedule({ id, date, title }: { id: string; date: GameDate; title: string }) {
  return (
    <form action={deleteSchedule.bind(null, id, date)}>
      <Button type="submit" variant="ghost" aria-label={`일정 삭제: ${title}`}>
        삭제
      </Button>
    </form>
  );
}
