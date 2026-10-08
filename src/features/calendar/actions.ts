"use server";

import { redirect } from "next/navigation";

import { requireCharacter } from "@/features/player/queries";
import { type FormState, codeFromDbError, fail, fieldErrors, withValues } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { fromLocal } from "@/lib/utils/zoned";

import { type ScheduleInput, ScheduleInputSchema, scheduleFormToObject } from "./schemas";

export type ScheduleFormState = FormState;

export async function createSchedule(
  _state: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  const failure = await saveSchedule(formData);
  return failure && withValues(failure, formData);
}

function toRow(s: ScheduleInput, tz: string) {
  const startsAt = fromLocal(s.date, s.allDay ? "00:00" : s.startTime!, tz);
  const endsAt = !s.allDay && s.endTime ? fromLocal(s.date, s.endTime, tz) : null;
  return {
    title: s.title,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt?.toISOString() ?? null,
    all_day: s.allDay,
    location: s.location,
    quest_id: s.questId,
    repeat_weekdays: s.repeatWeekly ? [...s.weekdays].sort((a, b) => a - b) : null,
    repeat_until: s.repeatWeekly ? s.until : null,
  };
}

async function saveSchedule(formData: FormData, id?: string): Promise<ScheduleFormState> {
  const player = await requireCharacter();
  const parsed = ScheduleInputSchema.safeParse(scheduleFormToObject(formData));
  if (!parsed.success) return fail("VALIDATION_FAILED", fieldErrors(parsed.error.issues));
  const row = toRow(parsed.data, player.profile.timezone);

  const supabase = await createClient();
  if (id) {
    const { data, error } = await supabase.from("schedules").update(row).eq("id", id).select("id");
    if (error) return fail(codeFromDbError(error));
    if (!data.length) return fail("NOT_FOUND");
    redirect(`/calendar?d=${parsed.data.date}&saved=1`);
  }
  const { error } = await supabase.from("schedules").insert(row);
  if (error) return fail(codeFromDbError(error));
  redirect(`/calendar?d=${parsed.data.date}&added=1`);
}

/** Edit a schedule; for a weekly series the change applies to every occurrence. */
export async function updateSchedule(
  id: string,
  _state: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  const failure = await saveSchedule(formData, id);
  return failure && withValues(failure, formData);
}

/** Delete a one-off schedule, or a whole weekly series. */
export async function deleteSchedule(id: string, date: string): Promise<void> {
  await requireCharacter();
  const supabase = await createClient();
  const { error } = await supabase.from("schedules").delete().eq("id", id);
  if (error) throw error;
  redirect(`/calendar?d=${encodeURIComponent(date)}`);
}

/**
 * Change one occurrence of a weekly series ("이번 회차만"): it becomes a one-off schedule linked
 * to the series, and the series skips that date (edit_occurrence, one transaction).
 */
export async function editOccurrence(
  seriesId: string,
  occurrenceDate: string,
  _state: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  const failure = await saveOccurrence(seriesId, occurrenceDate, formData);
  return failure && withValues(failure, formData);
}

async function saveOccurrence(
  seriesId: string,
  occurrenceDate: string,
  formData: FormData,
): Promise<ScheduleFormState> {
  const player = await requireCharacter();
  const parsed = ScheduleInputSchema.safeParse({
    ...scheduleFormToObject(formData),
    repeatWeekly: false,
  });
  if (!parsed.success) return fail("VALIDATION_FAILED", fieldErrors(parsed.error.issues));
  const row = toRow(parsed.data, player.profile.timezone);

  const supabase = await createClient();
  const { error } = await supabase.rpc("edit_occurrence", {
    p_series_id: seriesId,
    p_date: occurrenceDate,
    p_title: row.title,
    p_starts_at: row.starts_at,
    p_ends_at: row.ends_at ?? undefined,
    p_all_day: row.all_day,
    p_location: row.location ?? undefined,
    p_quest_id: row.quest_id ?? undefined,
  });
  if (error) return fail(codeFromDbError(error));
  redirect(`/calendar?d=${parsed.data.date}&saved=1`);
}

/** Undo "이번 회차만" changes: drop the changed copy and bring the series occurrence back. */
export async function restoreOccurrence(id: string, date: string): Promise<void> {
  await requireCharacter();
  const supabase = await createClient();
  const { error } = await supabase.rpc("restore_occurrence", { p_id: id });
  if (error) throw error;
  redirect(`/calendar?d=${encodeURIComponent(date)}&restored=1`);
}

/** Cancel a single occurrence of a weekly series ("이번만 건너뛰기"). */
export async function skipOccurrence(id: string, date: string): Promise<void> {
  await requireCharacter();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("VALIDATION_FAILED");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schedules")
    .select("skip_dates, repeat_weekdays")
    .eq("id", id)
    .single();
  if (error) throw error;
  if (!data.repeat_weekdays) throw new Error("VALIDATION_FAILED");
  if (!data.skip_dates.includes(date)) {
    const { error: updateError } = await supabase
      .from("schedules")
      .update({ skip_dates: [...data.skip_dates, date].sort() })
      .eq("id", id);
    if (updateError) throw updateError;
  }
  redirect(`/calendar?d=${encodeURIComponent(date)}&skipped=1`);
}
