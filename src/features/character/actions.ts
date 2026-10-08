"use server";

import { redirect } from "next/navigation";

import { type Result, codeFromDbError, fail, fieldErrors } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

import { CreateCharacterSchema, defaultAppearance } from "./schemas";

export type CreateCharacterState = Result<never> | null;

export async function createCharacter(
  _prev: CreateCharacterState,
  formData: FormData,
): Promise<CreateCharacterState> {
  const parsed = CreateCharacterSchema.safeParse({
    name: formData.get("name"),
    outfit: formData.get("outfit"),
  });
  if (!parsed.success) return fail("VALIDATION_FAILED", fieldErrors(parsed.error.issues));

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_character", {
    p_name: parsed.data.name,
    p_appearance: defaultAppearance(parsed.data.outfit),
  });
  if (error) {
    const code = codeFromDbError(error);
    if (code !== "CHARACTER_EXISTS") return fail(code);
    redirect("/adventure");
  }
  // New players pick their first quests from GM templates (GAME_MASTER §5).
  redirect("/onboarding/quests");
}
