import { z } from "zod";

const Time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "시간 형식이 올바르지 않아요.");

/** Domain schema for a fixed-time schedule (local date + times, converted on save). */
export const ScheduleInputSchema = z
  .object({
    title: z.string().trim().min(1, "일정 이름을 입력해 주세요.").max(80, "80자까지 쓸 수 있어요."),
    date: z.iso.date("날짜를 골라 주세요."),
    allDay: z.boolean(),
    startTime: Time.nullable(),
    endTime: Time.nullable(),
    location: z
      .string()
      .trim()
      .max(80, "80자까지 쓸 수 있어요.")
      .transform((v) => (v === "" ? null : v))
      .nullable(),
    questId: z.uuid().nullable(),
    /** Weekly repeat (classes, standing meetings). */
    repeatWeekly: z.boolean(),
    weekdays: z.array(z.number().int().min(1).max(7)).max(7),
    until: z.iso.date("날짜를 골라 주세요.").nullable(),
  })
  .superRefine((s, ctx) => {
    if (s.repeatWeekly && s.weekdays.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["weekdays"],
        message: "반복할 요일을 하나 이상 골라 주세요.",
      });
    }
    if (s.repeatWeekly && s.until && s.until < s.date) {
      ctx.addIssue({
        code: "custom",
        path: ["until"],
        message: "반복 종료일은 시작일 이후여야 해요.",
      });
    }
    if (s.allDay) return;
    if (!s.startTime) {
      ctx.addIssue({ code: "custom", path: ["startTime"], message: "시작 시간을 골라 주세요." });
    } else if (s.endTime && s.endTime <= s.startTime) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "끝나는 시간은 시작보다 늦어야 해요.",
      });
    }
  });

export type ScheduleInput = z.infer<typeof ScheduleInputSchema>;

export function scheduleFormToObject(formData: FormData) {
  const text = (key: string) => {
    const v = formData.get(key);
    return typeof v === "string" && v !== "" ? v : null;
  };
  return {
    title: text("title") ?? "",
    date: text("date") ?? "",
    allDay: formData.get("allDay") === "on",
    startTime: text("startTime"),
    endTime: text("endTime"),
    location: text("location"),
    questId: text("questId"),
    repeatWeekly: formData.get("repeatWeekly") === "on",
    weekdays: [...new Set(formData.getAll("weekdays").map(Number))].filter((n) => n >= 1 && n <= 7),
    until: text("until"),
  };
}
