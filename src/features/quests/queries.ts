import "server-only";

import { notFound } from "next/navigation";

import {
  type Difficulty,
  type EffectiveQuestStatus,
  type GameDate,
  type QuestType,
  type RepeatRule,
  RepeatRuleSchema,
  type Stat,
  effectiveStatus,
  questlineProgress,
} from "@/lib/game";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type QuestRow = Database["public"]["Tables"]["quests"]["Row"];

export interface QuestView {
  id: string;
  title: string;
  description: string | null;
  type: QuestType;
  difficulty: Difficulty;
  xp: number;
  primaryStat: Stat;
  status: EffectiveQuestStatus;
  deadline: GameDate | null;
  scheduledFor: GameDate | null;
  estimatedMinutes: number | null;
  repeat: RepeatRule | null;
  goal: { id: string; title: string } | null;
  completedAt: string | null;
  createdAt: string;
  /** Step order inside a batch created together (same created_at). */
  sortOrder: number;
}

export interface QuestlineView {
  id: string;
  title: string;
  description: string | null;
  targetDate: GameDate | null;
  status: "active" | "cleared" | "archived";
  progress: ReturnType<typeof questlineProgress>;
  steps: QuestView[];
}

const QUEST_COLUMNS =
  "id, title, description, type, difficulty, xp, primary_stat, status, deadline, scheduled_for, estimated_minutes, repeat_rule, goal_id, completed_at, created_at, sort_order, goals (id, title)";

type QuestSelect = Pick<
  QuestRow,
  | "id"
  | "title"
  | "description"
  | "type"
  | "difficulty"
  | "xp"
  | "primary_stat"
  | "status"
  | "deadline"
  | "scheduled_for"
  | "estimated_minutes"
  | "repeat_rule"
  | "goal_id"
  | "completed_at"
  | "created_at"
  | "sort_order"
> & { goals: { id: string; title: string } | null };

export function toQuestView(row: QuestSelect, today: GameDate): QuestView {
  const repeat = RepeatRuleSchema.safeParse(row.repeat_rule);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    difficulty: row.difficulty as Difficulty,
    xp: row.xp,
    primaryStat: row.primary_stat,
    status: effectiveStatus({ status: row.status, deadline: row.deadline, type: row.type }, today),
    deadline: row.deadline,
    scheduledFor: row.scheduled_for,
    estimatedMinutes: row.estimated_minutes,
    repeat: repeat.success ? repeat.data : null,
    goal: row.goals,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    sortOrder: row.sort_order,
  };
}

/** Ordering for lists: soonest deadline first, then newest. */
function byUrgency(a: QuestView, b: QuestView): number {
  if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
  if (a.deadline) return -1;
  if (b.deadline) return 1;
  return b.createdAt.localeCompare(a.createdAt);
}

/** Every non-archived quest (or only archived ones), with derived status. */
export async function listQuests(
  today: GameDate,
  options: { archived?: boolean } = {},
): Promise<QuestView[]> {
  const supabase = await createClient();
  let query = supabase
    .from("quests")
    .select(QUEST_COLUMNS)
    .order("created_at", { ascending: false });
  query = options.archived ? query.eq("status", "archived") : query.neq("status", "archived");
  const { data, error } = await query.returns<QuestSelect[]>();
  if (error) throw error;
  return data.map((row) => toQuestView(row, today)).sort(byUrgency);
}

export async function getQuest(id: string, today: GameDate): Promise<QuestView> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quests")
    .select(QUEST_COLUMNS)
    .eq("id", id)
    .returns<QuestSelect[]>()
    .maybeSingle();
  if (error && error.code !== "22P02") throw error;
  if (!data) notFound();
  return toQuestView(data, today);
}

/** Questlines (goals) with their steps and XP-weighted progress. */
export async function listQuestlines(
  today: GameDate,
  options: { includeArchived?: boolean } = {},
): Promise<QuestlineView[]> {
  const supabase = await createClient();
  let query = supabase
    .from("goals")
    .select(`id, title, description, target_date, status, quests (${QUEST_COLUMNS})`)
    .order("created_at", { ascending: true });
  if (!options.includeArchived) query = query.neq("status", "archived");
  const { data, error } = await query;
  if (error) throw error;
  return data.map((goal) => {
    const steps = (goal.quests as unknown as QuestSelect[])
      .map((q) => toQuestView(q, today))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.sortOrder - b.sortOrder);
    return {
      id: goal.id,
      title: goal.title,
      description: goal.description,
      targetDate: goal.target_date,
      status: goal.status,
      steps,
      progress: questlineProgress(steps.map((s) => ({ type: s.type, status: s.status, xp: s.xp }))),
    };
  });
}

/** Lightweight list for the questline picker in the quest form. */
export async function listQuestlineOptions(): Promise<Array<{ id: string; title: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .select("id, title")
    .eq("status", "active")
    .order("created_at");
  if (error) throw error;
  return data;
}
