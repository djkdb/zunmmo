"use server";

import { redirect } from "next/navigation";

import { type PlayerWithCharacter, playerToday, requireCharacter } from "@/features/player/queries";
import { getProgress, getUnlockedAchievements } from "@/features/progress/queries";
import type { CompletionOutcome } from "@/features/progress/types";
import {
  type FormState,
  type Result,
  codeFromDbError,
  fail,
  fieldErrors,
  ok,
  withValues,
} from "@/lib/errors";
import {
  type Difficulty,
  detectLevelUp,
  goalClearBonus,
  DEFAULT_DIFFICULTY,
  QUESTLINE_NEXT_STEP_DIFFICULTY,
  newlyUnlocked,
  questXp,
  templateById,
  templateStat,
} from "@/lib/game";
import { createClient } from "@/lib/supabase/server";

import {
  type QuestInput,
  QuestInputSchema,
  MAX_STARTER_QUESTS,
  QuestlineStepsSchema,
  questFormToObject,
  stepsFormToObject,
  validateNewDeadline,
} from "./schemas";

export type QuestFormState = FormState;

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
  const failure = await saveNewQuest(formData);
  return failure && withValues(failure, formData);
}

async function saveNewQuest(formData: FormData): Promise<QuestFormState> {
  const player = await requireCharacter();
  const parsed = QuestInputSchema.safeParse(questFormToObject(formData));
  if (!parsed.success) return fail("VALIDATION_FAILED", fieldErrors(parsed.error.issues));
  const deadlineError = validateNewDeadline(parsed.data, playerToday(player));
  if (deadlineError) return fail("VALIDATION_FAILED", deadlineError);

  const steps = questlineSteps(parsed.data, formData);
  if ("error" in steps) return steps.error;

  const supabase = await createClient();
  const goal = await resolveGoalId(supabase, parsed.data);
  if ("error" in goal) return goal.error;

  // One insert for the whole questline so either every step lands or none does.
  const rows = [steps.first, ...steps.extra].map((input, i) => ({
    ...toRow(input, goal.goalId),
    sort_order: i,
  }));
  const { data, error } = await supabase.from("quests").insert(rows).select("id");
  if (error || !data[0]) return fail(codeFromDbError(error));
  redirect(`/quests?created=${data[0].id}`);
}

/**
 * G5: a new questline may come with more steps, one per line. The first step keeps the
 * form's values; with "마지막 단계를 BOSS로" the form's deadline moves to the final boss.
 */
function questlineSteps(
  first: QuestInput,
  formData: FormData,
): { first: QuestInput; extra: QuestInput[] } | { error: QuestFormState } {
  if (first.type !== "main" || !first.newGoalTitle) return { first, extra: [] };
  const parsed = QuestlineStepsSchema.safeParse(stepsFormToObject(formData));
  if (!parsed.success) {
    return { error: fail("VALIDATION_FAILED", { steps: parsed.error.issues[0]!.message }) };
  }
  const { steps, lastIsBoss } = parsed.data;
  if (lastIsBoss && !steps.length) {
    return {
      error: fail("VALIDATION_FAILED", {
        steps: "보스로 만들 마지막 단계를 한 줄 이상 적어 주세요.",
      }),
    };
  }
  if (lastIsBoss && !first.deadline) {
    return { error: fail("VALIDATION_FAILED", { deadline: "보스 단계에는 마감일이 필요해요." }) };
  }

  const extra: QuestInput[] = steps.map((title, i) => {
    const isBoss = lastIsBoss && i === steps.length - 1;
    return {
      ...first,
      title,
      description: null,
      type: isBoss ? "boss" : "main",
      difficulty: isBoss ? DEFAULT_DIFFICULTY.boss : QUESTLINE_NEXT_STEP_DIFFICULTY,
      deadline: isBoss ? first.deadline : null,
      estimatedMinutes: null,
    };
  });
  return { first: lastIsBoss ? { ...first, deadline: null } : first, extra };
}

export async function updateQuest(
  questId: string,
  _prev: QuestFormState,
  formData: FormData,
): Promise<QuestFormState> {
  const failure = await saveQuest(questId, formData);
  return failure && withValues(failure, formData);
}

async function saveQuest(questId: string, formData: FormData): Promise<QuestFormState> {
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

// ───────── completion (XP moves only through these RPCs) ─────────

async function finishQuestline(
  supabase: Awaited<ReturnType<typeof createClient>>,
  goalId: string,
): Promise<{ title: string; bonus: number; totalXpAfter: number } | null> {
  const { data: goal, error } = await supabase
    .from("goals")
    .select("title, status, quests (type, status, xp)")
    .eq("id", goalId)
    .single();
  if (error || goal.status !== "active") return null;
  const steps = goal.quests.filter(
    (q) => (q.type === "main" || q.type === "boss") && q.status !== "archived",
  );
  if (!steps.length || steps.some((q) => q.status !== "completed")) return null;

  const bonus = goalClearBonus(steps.reduce((sum, q) => sum + q.xp, 0));
  const { data, error: clearError } = await supabase.rpc("clear_goal", {
    p_goal_id: goalId,
    p_bonus: bonus,
  });
  if (clearError) return null;
  return { title: goal.title, bonus, totalXpAfter: Number(data.total_xp_after) };
}

/** Badges reached by this completion (idempotent: the DB primary key ignores repeats). */
async function unlockAchievements(
  supabase: Awaited<ReturnType<typeof createClient>>,
  player: PlayerWithCharacter,
  totalXpAfter: number,
): Promise<CompletionOutcome["achievements"]> {
  const { data: character } = await supabase
    .from("characters")
    .select("character_stats (stat, xp)")
    .single();
  const statXp = { ...player.statXp };
  for (const s of character?.character_stats ?? []) statXp[s.stat] = s.xp;
  const [progress, unlocked] = await Promise.all([
    getProgress({ profile: player.profile, statXp, totalXp: totalXpAfter }),
    getUnlockedAchievements(),
  ]);
  const fresh = newlyUnlocked(progress.snapshot, new Set(unlocked.keys()));
  if (!fresh.length) return [];
  const { error } = await supabase.from("user_achievements").upsert(
    fresh.map((a) => ({ achievement_id: a.id })),
    { onConflict: "user_id,achievement_id", ignoreDuplicates: true },
  );
  if (error) return [];
  return fresh.map((a) => ({ id: a.id, name: a.name, rarity: a.rarity, icon: a.icon }));
}

export async function completeQuest(questId: string): Promise<Result<CompletionOutcome>> {
  const player = await requireCharacter();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_quest", { p_quest_id: questId });
  if (error) return fail(codeFromDbError(error));

  const { data: quest } = await supabase
    .from("quests")
    .select("title, goal_id")
    .eq("id", questId)
    .single();
  const before = Number(data.total_xp_before);
  let after = Number(data.total_xp_after);

  const goalClear = quest?.goal_id ? await finishQuestline(supabase, quest.goal_id) : null;
  if (goalClear) after = goalClear.totalXpAfter;

  const achievements = await unlockAchievements(supabase, player, after);

  return ok({
    questId,
    questTitle: quest?.title ?? "",
    character: { name: player.character.name, outfit: player.character.outfit },
    xpChange: data.xp_change ?? 0,
    totalXpBefore: before,
    totalXpAfter: after,
    levelUp: detectLevelUp(before, after),
    goalClear: goalClear ? { title: goalClear.title, bonus: goalClear.bonus } : null,
    achievements,
  });
}

export async function uncompleteQuest(
  questId: string,
): Promise<Result<{ xpChange: number; totalXpAfter: number }>> {
  await requireCharacter();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("uncomplete_quest", { p_quest_id: questId });
  if (error) return fail(codeFromDbError(error));
  return ok({ xpChange: data.xp_change ?? 0, totalXpAfter: Number(data.total_xp_after) });
}

// ───────── templates (GAME_MASTER §5) ─────────

/** Onboarding: turn the picked templates into quests, then open the adventure. */
export async function createQuestsFromTemplates(
  _prev: QuestFormState,
  formData: FormData,
): Promise<QuestFormState> {
  await requireCharacter();
  const ids = [...new Set(formData.getAll("template").map(String))].slice(0, MAX_STARTER_QUESTS);
  const rows = [];
  for (const id of ids) {
    const template = templateById(id);
    if (!template) continue;
    const parsed = QuestInputSchema.safeParse({
      title: template.title,
      type: template.type,
      difficulty: template.difficulty,
      primaryStat: templateStat(template),
      estimatedMinutes: template.estimatedMinutes ?? null,
      repeat: template.repeat ?? null,
    });
    if (!parsed.success) return fail("VALIDATION_FAILED");
    rows.push({ ...toRow(parsed.data, null), source: "template" as const });
  }
  if (rows.length) {
    const supabase = await createClient();
    const { error } = await supabase.from("quests").insert(rows);
    if (error) return fail(codeFromDbError(error));
  }
  redirect("/adventure");
}
