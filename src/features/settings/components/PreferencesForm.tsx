"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { formatMinutes } from "@/lib/utils/format";

import { updatePreferences } from "../actions";
import { CAPACITY_CHOICES, COMMON_TIMEZONES, DAY_START_HOURS, hourLabel } from "../schemas";

export interface Preferences {
  timezone: string;
  dayStartHour: number;
  dailyCapacityMin: number;
}

/** How the game measures a player's day (GAME_SYSTEM §1.6, §8). */
export function PreferencesForm({ initial }: { initial: Preferences }) {
  const [state, action, pending] = useActionState(updatePreferences, null);
  const v = (key: string) => state?.values?.[key];
  const fieldError = (key: string) => (state ? state.error.fields?.[key] : undefined);
  const zones: readonly string[] = COMMON_TIMEZONES.includes(
    initial.timezone as (typeof COMMON_TIMEZONES)[number],
  )
    ? COMMON_TIMEZONES
    : [initial.timezone, ...COMMON_TIMEZONES];
  const capacities: readonly number[] = CAPACITY_CHOICES.includes(
    initial.dailyCapacityMin as (typeof CAPACITY_CHOICES)[number],
  )
    ? CAPACITY_CHOICES
    : [...CAPACITY_CHOICES, initial.dailyCapacityMin].sort((a, b) => a - b);

  return (
    <form action={action} className="flex flex-col gap-5">
      <Select
        label="시간대"
        name="timezone"
        defaultValue={v("timezone") ?? initial.timezone}
        error={fieldError("timezone")}
      >
        {zones.map((zone) => (
          <option key={zone} value={zone}>
            {zone}
          </option>
        ))}
      </Select>
      <Select
        label="하루가 시작되는 시각"
        name="dayStartHour"
        defaultValue={v("dayStartHour") ?? String(initial.dayStartHour)}
        hint="이 시각 전에 끝낸 퀘스트는 전날 기록으로 쳐요. 밤늦게 끝내도 연속 기록이 이어져요."
        error={fieldError("dayStartHour")}
      >
        {DAY_START_HOURS.map((hour) => (
          <option key={hour} value={hour}>
            {hourLabel(hour)}
          </option>
        ))}
      </Select>
      <Select
        label="하루 모험 시간"
        name="dailyCapacityMin"
        defaultValue={v("dailyCapacityMin") ?? String(initial.dailyCapacityMin)}
        hint="오늘의 모험 추천이 이 시간 안에서 퀘스트를 골라요. 고정 일정 시간은 빼고 계산해요."
        error={fieldError("dailyCapacityMin")}
      >
        {capacities.map((minutes) => (
          <option key={minutes} value={minutes}>
            {formatMinutes(minutes)}
          </option>
        ))}
      </Select>
      {state && !state.error.fields && (
        <p role="alert" className="text-small text-danger-text">
          {state.error.message}
        </p>
      )}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "저장 중…" : "플레이 설정 저장"}
        </Button>
      </div>
    </form>
  );
}
