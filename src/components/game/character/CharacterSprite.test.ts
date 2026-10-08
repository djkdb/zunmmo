import { describe, expect, it } from "vitest";

import { CHARACTER_STATES, resolveCharacterState } from "./CharacterSprite";

describe("resolveCharacterState", () => {
  it("resolves every supported state to a drawn animation", () => {
    for (const state of CHARACTER_STATES) {
      expect(["idle", "walking"]).toContain(resolveCharacterState(state));
    }
  });

  it("uses drawn states directly and follows the fallback chain otherwise", () => {
    expect(resolveCharacterState("walking")).toBe("walking");
    expect(resolveCharacterState("running")).toBe("walking");
    expect(resolveCharacterState("level-up")).toBe("idle");
  });
});
