import { describe, expect, it } from "vitest";

import { QuestInputSchema, questFormToObject, validateNewDeadline } from "./schemas";

const form = (entries: Array<[string, string]>) => {
  const fd = new FormData();
  for (const [k, v] of entries) fd.append(k, v);
  return fd;
};

const base: Array<[string, string]> = [
  ["title", "  컴퓨터네트워크 과제  "],
  ["difficulty", "4"],
  ["primaryStat", "foc"],
];

describe("QuestInputSchema", () => {
  it("parses a boss quest from FormData", () => {
    const parsed = QuestInputSchema.parse(
      questFormToObject(form([...base, ["type", "boss"], ["deadline", "2026-10-09"]])),
    );
    expect(parsed).toMatchObject({
      title: "컴퓨터네트워크 과제",
      type: "boss",
      difficulty: 4,
      deadline: "2026-10-09",
      repeat: null,
      description: null,
      estimatedMinutes: null,
    });
  });

  it("requires a deadline for bosses and a repeat rule for dailies", () => {
    const boss = QuestInputSchema.safeParse(questFormToObject(form([...base, ["type", "boss"]])));
    expect(boss.success).toBe(false);
    expect(boss.error?.issues[0]?.path).toEqual(["deadline"]);

    const daily = QuestInputSchema.safeParse(questFormToObject(form([...base, ["type", "daily"]])));
    expect(daily.error?.issues[0]?.path).toEqual(["repeat"]);
  });

  it("builds weekly repeat rules from checkboxes and drops deadlines for dailies", () => {
    const parsed = QuestInputSchema.parse(
      questFormToObject(
        form([
          ...base,
          ["type", "daily"],
          ["repeatFreq", "weekly"],
          ["weekdays", "1"],
          ["weekdays", "3"],
          ["deadline", "2026-10-30"],
        ]),
      ),
    );
    expect(parsed.repeat).toEqual({ freq: "weekly", weekdays: [1, 3] });
    expect(parsed.deadline).toBeNull();
  });

  it("needs a questline for main quests — existing or new", () => {
    expect(
      QuestInputSchema.safeParse(questFormToObject(form([...base, ["type", "main"]]))).success,
    ).toBe(false);
    const created = QuestInputSchema.parse(
      questFormToObject(
        form([...base, ["type", "main"], ["goalId", "new"], ["newGoalTitle", "웹서비스 출시"]]),
      ),
    );
    expect(created).toMatchObject({ goalId: null, newGoalTitle: "웹서비스 출시" });
  });

  it("rejects out-of-range values", () => {
    expect(
      QuestInputSchema.safeParse(
        questFormToObject(form([...base, ["type", "side"], ["estimatedMinutes", "2"]])),
      ).success,
    ).toBe(false);
    expect(
      QuestInputSchema.safeParse(
        questFormToObject(
          form([
            ["title", ""],
            ["type", "side"],
            ["difficulty", "2"],
            ["primaryStat", "cre"],
          ]),
        ),
      ).success,
    ).toBe(false);
    expect(
      QuestInputSchema.safeParse(questFormToObject(form([...base, ["type", "hidden"]]))).success,
    ).toBe(false);
  });
});

describe("validateNewDeadline", () => {
  it("rejects past deadlines on create", () => {
    const input = QuestInputSchema.parse(
      questFormToObject(form([...base, ["type", "boss"], ["deadline", "2026-10-01"]])),
    );
    expect(validateNewDeadline(input, "2026-10-08")).toEqual({
      deadline: "오늘 이후 날짜를 골라 주세요.",
    });
    expect(validateNewDeadline({ ...input, deadline: "2026-10-08" }, "2026-10-08")).toBeNull();
  });
});
