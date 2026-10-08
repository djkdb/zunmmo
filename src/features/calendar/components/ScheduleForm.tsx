"use client";

import { useActionState, useState } from "react";

import { PixelButton } from "@/components/pixel/PixelButton";
import { Select } from "@/components/ui/Select";
import { TextField } from "@/components/ui/TextField";
import type { GameDate } from "@/lib/game";

import { type ScheduleFormState, createSchedule } from "../actions";

/** New fixed-time schedule. Times are the player's local wall clock (converted on save). */
export function ScheduleForm({
  date,
  quests,
}: {
  date: GameDate;
  quests: ReadonlyArray<{ id: string; title: string }>;
}) {
  const [state, action, pending] = useActionState<ScheduleFormState, FormData>(
    createSchedule,
    null,
  );
  const [allDay, setAllDay] = useState(false);
  const fieldError = (key: string) => (state && !state.ok ? state.error.fields?.[key] : undefined);
  const v = (key: string) => state?.values?.[key];
  const generalError = state && !state.ok && !state.error.fields ? state.error.message : null;

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      <TextField
        label="일정 이름"
        name="title"
        defaultValue={v("title")}
        required
        maxLength={80}
        autoComplete="off"
        placeholder="예: 토요일 축구 경기"
        error={fieldError("title")}
      />
      <TextField
        label="날짜"
        name="date"
        type="date"
        defaultValue={v("date") ?? date}
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
            defaultValue={v("startTime") ?? "09:00"}
            error={fieldError("startTime")}
          />
          <TextField
            label="끝 (선택)"
            name="endTime"
            type="time"
            defaultValue={v("endTime")}
            hint="비워 두면 1시간으로 계산해요."
            error={fieldError("endTime")}
          />
        </div>
      )}

      <TextField
        label="장소 (선택)"
        name="location"
        defaultValue={v("location")}
        maxLength={80}
        error={fieldError("location")}
      />

      {quests.length > 0 && (
        <Select label="연결할 퀘스트 (선택)" name="questId" defaultValue={v("questId") ?? ""}>
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
        일정 추가
      </PixelButton>
    </form>
  );
}
