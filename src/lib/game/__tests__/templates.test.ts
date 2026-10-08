import { describe, expect, it } from "vitest";

import { RepeatRuleSchema } from "../repeat";
import { QUEST_CATEGORIES } from "../stats";
import {
  QUEST_TEMPLATES,
  STARTER_TEMPLATE_IDS,
  TEMPLATE_GROUPS,
  templateById,
  templateStat,
} from "../templates";

describe("quest templates", () => {
  it("has about thirty unique, well-formed drafts", () => {
    expect(QUEST_TEMPLATES.length).toBeGreaterThanOrEqual(25);
    expect(new Set(QUEST_TEMPLATES.map((t) => t.id)).size).toBe(QUEST_TEMPLATES.length);
    for (const t of QUEST_TEMPLATES) {
      expect(t.title.length, t.id).toBeLessThanOrEqual(80);
      if (t.type === "daily") expect(RepeatRuleSchema.safeParse(t.repeat).success, t.id).toBe(true);
      else expect(t.repeat, t.id).toBeUndefined();
      if (t.estimatedMinutes !== undefined) {
        expect(t.estimatedMinutes).toBeGreaterThanOrEqual(5);
      }
    }
  });

  it("covers every group and every listed category", () => {
    const grouped = new Set(TEMPLATE_GROUPS.flatMap((g) => g.categories));
    for (const c of grouped) expect(QUEST_CATEGORIES).toContain(c);
    for (const t of QUEST_TEMPLATES) expect(grouped.has(t.category), t.id).toBe(true);
  });

  it("derives the stat from the category and resolves starters", () => {
    expect(templateStat(templateById("exercise-30")!)).toBe("vit");
    expect(templateStat(templateById("study-vocab")!)).toBe("int");
    for (const id of STARTER_TEMPLATE_IDS) expect(templateById(id)).toBeDefined();
  });
});
