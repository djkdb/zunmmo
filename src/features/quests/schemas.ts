import { z } from "zod";

import { type GameDate, RepeatRuleSchema, STATS, daysBetween } from "@/lib/game";

/** Quest types a player can create. HIDDEN quests are system-made (post-MVP). */
export const CREATABLE_TYPES = ["main", "daily", "side", "boss"] as const;
export type CreatableType = (typeof CREATABLE_TYPES)[number];

const IsoDate = z.iso.date("날짜 형식이 올바르지 않아요.");

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

/**
 * Domain schema for creating/editing a quest — the only door into `quests`.
 * XP is never part of the input: the action computes it with questXp().
 */
export const QuestInputSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "퀘스트 이름을 입력해 주세요.")
      .max(80, "80자까지 쓸 수 있어요."),
    description: optionalText(1000, "1000자까지 쓸 수 있어요."),
    type: z.enum(CREATABLE_TYPES, "퀘스트 종류를 골라 주세요."),
    difficulty: z.coerce.number().int().min(1).max(5),
    primaryStat: z.enum(STATS),
    deadline: IsoDate.nullable().default(null),
    scheduledFor: IsoDate.nullable().default(null),
    estimatedMinutes: z.coerce
      .number()
      .int()
      .min(5, "5분 이상으로 입력해 주세요.")
      .max(1440, "하루(1440분)를 넘길 수 없어요.")
      .nullable()
      .default(null),
    repeat: RepeatRuleSchema.nullable().default(null),
    goalId: z.uuid().nullable().default(null),
    newGoalTitle: optionalText(80, "80자까지 쓸 수 있어요."),
  })
  .superRefine((q, ctx) => {
    if (q.type === "boss" && !q.deadline) {
      ctx.addIssue({
        code: "custom",
        path: ["deadline"],
        message: "보스 퀘스트에는 마감일이 필요해요.",
      });
    }
    if (q.type === "daily" && !q.repeat) {
      ctx.addIssue({ code: "custom", path: ["repeat"], message: "반복 요일을 골라 주세요." });
    }
    if (q.type === "main" && !q.goalId && !q.newGoalTitle) {
      ctx.addIssue({
        code: "custom",
        path: ["goalId"],
        message: "어느 메인 퀘스트라인의 단계인지 골라 주세요.",
      });
    }
  })
  .transform((q) => ({
    ...q,
    // Fields that do not apply to the type are dropped, never stored.
    repeat: q.type === "daily" ? q.repeat : null,
    deadline: q.type === "daily" ? null : q.deadline,
  }));

export type QuestInput = z.output<typeof QuestInputSchema>;

/** A deadline in the past is allowed when editing (it just shows as expired) but not on create. */
export function validateNewDeadline(
  input: QuestInput,
  today: GameDate,
): Record<string, string> | null {
  if (input.deadline && daysBetween(today, input.deadline) < 0) {
    return { deadline: "오늘 이후 날짜를 골라 주세요." };
  }
  return null;
}

/** FormData → raw object for QuestInputSchema (checkbox groups, empty strings, repeat fields). */
export function questFormToObject(formData: FormData): Record<string, unknown> {
  const text = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" && value.trim() !== "" ? value : null;
  };
  const freq = text("repeatFreq");
  let repeat: unknown = null;
  if (freq === "daily") repeat = { freq: "daily" };
  else if (freq === "weekly")
    repeat = { freq: "weekly", weekdays: formData.getAll("weekdays").map(Number) };
  else if (freq === "weekly_count")
    repeat = { freq: "weekly_count", timesPerWeek: Number(text("timesPerWeek")) };

  return {
    title: formData.get("title") ?? "",
    description: text("description"),
    type: text("type"),
    difficulty: text("difficulty"),
    primaryStat: text("primaryStat"),
    deadline: text("deadline"),
    scheduledFor: text("scheduledFor"),
    estimatedMinutes: text("estimatedMinutes"),
    repeat,
    goalId: text("goalId") === "new" ? null : text("goalId"),
    newGoalTitle: text("goalId") === "new" ? text("newGoalTitle") : null,
  };
}

export const GoalInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "퀘스트라인 이름을 입력해 주세요.")
    .max(80, "80자까지 쓸 수 있어요."),
  description: optionalText(1000, "1000자까지 쓸 수 있어요."),
  targetDate: IsoDate.nullable().default(null),
});
