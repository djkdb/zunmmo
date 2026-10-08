"use client";

import { useActionState, useState } from "react";

import { PixelButton } from "@/components/pixel/PixelButton";
import { Select } from "@/components/ui/Select";
import { TextField } from "@/components/ui/TextField";
import { type GameDate, WEEKDAYS, isoWeekday, weekdayLabel } from "@/lib/game";
import { cn } from "@/lib/utils/cn";

import type { ScheduleFormState } from "../actions";

export interface ScheduleFormValues {
  title: string;
  date: GameDate;
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
  location: string | null;
  questId: string | null;
  repeat: { weekdays: number[]; until: GameDate | null } | null;
}

interface ScheduleFormProps {
  action: (state: ScheduleFormState, formData: FormData) => Promise<ScheduleFormState>;
  date: GameDate;
  quests: ReadonlyArray<{ id: string; title: string }>;
  initial?: ScheduleFormValues;
  submitLabel: string;
}

/**
 * Fixed-time schedule, one-off or weekly (classes, standing meetings). Times are the player's
 * local wall clock (converted on save); a weekly series keeps that wall time every week.
 */
export function ScheduleForm({ action, date, quests, initial, submitLabel }: ScheduleFormProps) {
  const [state, formAction, pending] = useActionState<ScheduleFormState, FormData>(action, null);
  const [allDay, setAllDay] = useState(initial?.allDay ?? false);
  const [repeat, setRepeat] = useState(Boolean(initial?.repeat));
  const [weekdays, setWeekdays] = useState<number[]>(
    initial?.repeat?.weekdays ?? [isoWeekday(initial?.date ?? date)],
  );
  const fieldError = (key: string) => (state && !state.ok ? state.error.fields?.[key] : undefined);
  const v = (key: string) => state?.values?.[key];
  const generalError = state && !state.ok && !state.error.fields ? state.error.message : null;

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <TextField
        label="일정 이름"
        name="title"
        defaultValue={v("title") ?? initial?.title}
        required
        maxLength={80}
        autoComplete="off"
        placeholder="예: 자료구조 수업"
        error={fieldError("title")}
      />
      <TextField
        label={repeat ? "시작 날짜" : "날짜"}
        name="date"
        type="date"
        defaultValue={v("date") ?? initial?.date ?? date}
        required
        error={fieldError("date")}
      />

      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-small font-semibold text-text-secondary">
        <input
          type="checkbox"
          name="allDay"
          checked={allDay}
          onChange={(e) => setAllDay(e.target.checked)}
          className="size-5 accent-accent"
        />
        하루 종일
      </label>

      {!allDay && (
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="시작"
            name="startTime"
            type="time"
            defaultValue={v("startTime") ?? initial?.startTime ?? "09:00"}
            error={fieldError("startTime")}
          />
          <TextField
            label="끝 (선택)"
            name="endTime"
            type="time"
            defaultValue={v("endTime") ?? initial?.endTime ?? undefined}
            hint="비워 두면 1시간으로 계산해요."
            error={fieldError("endTime")}
          />
        </div>
      )}

      <fieldset className="flex flex-col gap-3 rounded-sm border border-border p-4">
        <legend className="sr-only">반복</legend>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-small font-semibold text-text-secondary">
          <input
            type="checkbox"
            name="repeatWeekly"
            checked={repeat}
            onChange={(e) => setRepeat(e.target.checked)}
            className="size-5 accent-accent"
          />
          매주 반복 (수업, 정기 미팅)
        </label>
        {repeat && (
          <>
            <div className="flex gap-1.5" role="group" aria-label="반복 요일">
              {WEEKDAYS.map((day) => {
                const checked = weekdays.includes(day);
                return (
                  <label
                    key={day}
                    className={cn(
                      "relative flex size-11 cursor-pointer items-center justify-center rounded-sm border text-small font-semibold",
                      "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus",
                      checked
                        ? "border-accent bg-accent text-on-accent"
                        : "border-border-strong text-text-muted",
                    )}
                  >
                    <input
                      type="checkbox"
                      name="weekdays"
                      value={day}
                      checked={checked}
                      aria-label={`${weekdayLabel(day)}요일`}
                      onChange={() =>
                        setWeekdays((cur) =>
                          checked ? cur.filter((d) => d !== day) : [...cur, day],
                        )
                      }
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                    {weekdayLabel(day)}
                  </label>
                );
              })}
            </div>
            {fieldError("weekdays") && (
              <p className="text-caption text-danger-text">{fieldError("weekdays")}</p>
            )}
            <TextField
              label="반복 종료일 (선택)"
              name="until"
              type="date"
              defaultValue={v("until") ?? initial?.repeat?.until ?? undefined}
              hint="학기 마지막 주처럼 끝나는 날이 있으면 골라 주세요."
              error={fieldError("until")}
            />
          </>
        )}
      </fieldset>

      <TextField
        label="장소 (선택)"
        name="location"
        defaultValue={v("location") ?? initial?.location ?? undefined}
        maxLength={80}
        error={fieldError("location")}
      />

      {quests.length > 0 && (
        <Select
          label="연결할 퀘스트 (선택)"
          name="questId"
          defaultValue={v("questId") ?? initial?.questId ?? ""}
        >
          <option value="">연결 안 함</option>
          {quests.map((q) => (
            <option key={q.id} value={q.id}>
              {q.title}
            </option>
          ))}
        </Select>
      )}

      {generalError && (
        <p role="alert" className="text-small text-danger-text">
          {generalError}
        </p>
      )}

      <PixelButton type="submit" variant="accent" size="lg" block loading={pending}>
        {submitLabel}
      </PixelButton>
    </form>
  );
}
