"use server";

import { redirect } from "next/navigation";

import { requireCharacter } from "@/features/player/queries";
import { type FormState, codeFromDbError, fail, fieldErrors, withValues } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { fromLocal } from "@/lib/utils/zoned";

import { ScheduleInputSchema, scheduleFormToObject } from "./schemas";

export type ScheduleFormState = FormState;

export async function createSchedule(
  _state: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  const failure = await saveSchedule(formData);
  return failure && withValues(failure, formData);
}

async function saveSchedule(formData: FormData): Promise<ScheduleFormState> {
  const player = await requireCharacter();
  const parsed = ScheduleInputSchema.safeParse(scheduleFormToObject(formData));
  if (!parsed.success) return fail("VALIDATION_FAILED", fieldErrors(parsed.error.issues));
  const s = parsed.data;
  const tz = player.profile.timezone;

  const startsAt = fromLocal(s.date, s.allDay ? "00:00" : s.startTime!, tz);
  const endsAt = !s.allDay && s.endTime ? fromLocal(s.date, s.endTime, tz) : null;

  const supabase = await createClient();
  const { error } = await supabase.from("schedules").insert({
    title: s.title,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt?.toISOString() ?? null,
    all_day: s.allDay,
    location: s.location,
    quest_id: s.questId,
  });
  if (error) return fail(codeFromDbError(error));
  redirect(`/calendar?d=${s.date}&added=1`);
}

export async function deleteSchedule(id: string, date: string): Promise<void> {
  await requireCharacter();
  const supabase = await createClient();
  const { error } = await supabase.from("schedules").delete().eq("id", id);
  if (error) throw error;
  redirect(`/calendar?d=${encodeURIComponent(date)}`);
}
