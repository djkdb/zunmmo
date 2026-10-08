import { describe, expect, it } from "vitest";

import { AppearanceSchema, CreateCharacterSchema, defaultAppearance, outfitOf } from "./schemas";

describe("character schemas", () => {
  it("default appearance is valid for every outfit", () => {
    for (const outfit of ["royal", "emerald", "violet", "ember"] as const) {
      expect(AppearanceSchema.parse(defaultAppearance(outfit)).outfit.color).toBe(outfit);
    }
  });

  it("falls back to royal for unknown shapes", () => {
    expect(outfitOf({ version: 2 })).toBe("royal");
    expect(outfitOf(defaultAppearance("ember"))).toBe("ember");
  });

  it("trims and bounds names", () => {
    expect(CreateCharacterSchema.parse({ name: "  성준 ", outfit: "royal" }).name).toBe("성준");
    expect(CreateCharacterSchema.safeParse({ name: "   ", outfit: "royal" }).success).toBe(false);
    expect(
      CreateCharacterSchema.safeParse({ name: "가".repeat(17), outfit: "royal" }).success,
    ).toBe(false);
    expect(CreateCharacterSchema.safeParse({ name: "준", outfit: "gold" }).success).toBe(false);
  });
});
