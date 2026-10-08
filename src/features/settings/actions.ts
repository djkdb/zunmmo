"use server";

import { redirect } from "next/navigation";

import { defaultAppearance } from "@/features/character/schemas";
import { requireCharacter } from "@/features/player/queries";
import { type FormState, codeFromDbError, fail, fieldErrors, withValues } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

import { CharacterSettingsSchema, DELETE_CONFIRMATION, PreferencesSchema } from "./schemas";

export async function updatePreferences(_prev: FormState, formData: FormData): Promise<FormState> {
  const player = await requireCharacter();
  const parsed = PreferencesSchema.safeParse({
    timezone: formData.get("timezone"),
    dayStartHour: formData.get("dayStartHour"),
    dailyCapacityMin: formData.get("dailyCapacityMin"),
  });
  if (!parsed.success) {
    return withValues(fail("VALIDATION_FAILED", fieldErrors(parsed.error.issues)), formData);
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      timezone: parsed.data.timezone,
      day_start_hour: parsed.data.dayStartHour,
      daily_capacity_min: parsed.data.dailyCapacityMin,
    })
    .eq("id", player.userId);
  if (error) return withValues(fail(codeFromDbError(error)), formData);
  redirect("/settings?saved=preferences");
}

export async function updateCharacter(_prev: FormState, formData: FormData): Promise<FormState> {
  const player = await requireCharacter();
  const parsed = CharacterSettingsSchema.safeParse({
    name: formData.get("name"),
    outfit: formData.get("outfit"),
  });
  if (!parsed.success) {
    return withValues(fail("VALIDATION_FAILED", fieldErrors(parsed.error.issues)), formData);
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("characters")
    .update({ name: parsed.data.name, appearance: defaultAppearance(parsed.data.outfit) })
    .eq("id", player.character.id);
  if (error) return withValues(fail(codeFromDbError(error)), formData);
  redirect("/settings?saved=character");
}

/** Erase the account (DB cascades everything), end the session and leave the game. */
export async function deleteAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireCharacter();
  if (String(formData.get("confirm") ?? "").trim() !== DELETE_CONFIRMATION) {
    return fail("VALIDATION_FAILED", {
      confirm: `확인을 위해 "${DELETE_CONFIRMATION}"를 입력해 주세요.`,
    });
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return fail(codeFromDbError(error));
  // The user no longer exists server-side; only the local session cookies need clearing.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/?farewell=1");
}
