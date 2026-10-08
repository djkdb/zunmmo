import { describe, expect, it } from "vitest";

import { CHARACTER_STATES, resolveCharacterState } from "./CharacterSprite";

describe("resolveCharacterState", () => {
  it("resolves every supported state to a drawn animation", () => {
    for (const state of CHARACTER_STATES) {
      expect(resolveCharacterState(state)).toBe("idle");
    }
  });
});
