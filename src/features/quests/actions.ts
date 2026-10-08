"use server";

import { redirect } from "next/navigation";

import { playerToday, requireCharacter } from "@/features/player/queries";
import { type Result, codeFromDbError, fail, fieldErrors } from "@/lib/errors";
import { type Difficulty, questXp } from "@/lib/game";
import { createClient } from "@/lib/supabase/server";

import {
  type QuestInput,
  QuestInputSchema,
  questFormToObject,
  validateNewDeadline,
} from "./schemas";

export type QuestFormState = Result<never> | null;

function toRow(input: QuestInput, goalId: string | null) {
  return {
    title: input.title,
    description: input.description,
    type: input.type,
    difficulty: input.difficulty,
    // The only place quest XP is decided (GAME_SYSTEM §1.3) — never taken from the client.
    xp: questXp(input.type, input.difficulty as Difficulty),
    primary_stat: input.primaryStat,
    deadline: input.deadline,
    scheduled_for: input.scheduledFor,
    estimated_minutes: input.estimatedMinutes,
    repeat_rule: input.repeat,
    goal_id: goalId,
  };
}

async function resolveGoalId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: QuestInput,
): Promise<{ goalId: string | null } | { error: QuestFormState }> {
  if (!input.newGoalTitle) return { goalId: input.goalId };
  const { data, error } = await supabase
    .from("goals")
    .insert({ title: input.newGoalTitle })
    .select("id")
    .single();
  if (error) return { error: fail(codeFromDbError(error)) };
  return { goalId: data.id };
}

export async function createQuest(
  _prev: QuestFormState,
  formData: FormData,
): Promise<QuestFormState> {
  const player = await requireCharacter();
  const parsed = QuestInputSchema.safeParse(questFormToObject(formData));
  if (!parsed.success) return fail("VALIDATION_FAILED", fieldErrors(parsed.error.issues));
  const deadlineError = validateNewDeadline(parsed.data, playerToday(player));
  if (deadlineError) return fail("VALIDATION_FAILED", deadlineError);

  const supabase = await createClient();
  const goal = await resolveGoalId(supabase, parsed.data);
  if ("error" in goal) return goal.error;

  const { data, error } = await supabase
    .from("quests")
    .insert(toRow(parsed.data, goal.goalId))
    .select("id")
    .single();
  if (error) return fail(codeFromDbError(error));
  redirect(`/quests?created=${data.id}`);
}

export async function updateQuest(
  questId: string,
  _prev: QuestFormState,
  formData: FormData,
): Promise<QuestFormState> {
  await requireCharacter();
  const parsed = QuestInputSchema.safeParse(questFormToObject(formData));
  if (!parsed.success) return fail("VALIDATION_FAILED", fieldErrors(parsed.error.issues));

  const supabase = await createClient();
  const goal = await resolveGoalId(supabase, parsed.data);
  if ("error" in goal) return goal.error;

  const { data, error } = await supabase
    .from("quests")
    .update(toRow(parsed.data, goal.goalId))
    .eq("id", questId)
    .select("id");
  if (error) return fail(codeFromDbError(error));
  if (!data.length) return fail("QUEST_NOT_FOUND");
  redirect(`/quests/${questId}?saved=1`);
}

export async function setQuestArchived(questId: string, archived: boolean): Promise<void> {
  await requireCharacter();
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_quest_archived", {
    p_quest_id: questId,
    p_archived: archived,
  });
  if (error) throw new Error(codeFromDbError(error));
  redirect(archived ? "/quests?archived=1" : `/quests/${questId}`);
}
