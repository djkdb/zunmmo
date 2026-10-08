import { describe, expect, it } from "vitest";

import { CHARACTER_STATES, resolveCharacterState } from "./CharacterSprite";
import { SPRITE_SHEETS } from "./sprite-sheets.generated";

const DRAWN = Object.keys(SPRITE_SHEETS.adventurer.states);

describe("resolveCharacterState", () => {
  it("resolves every supported state to a drawn animation", () => {
    for (const state of CHARACTER_STATES) {
      expect(DRAWN).toContain(resolveCharacterState(state));
    }
  });

  it("uses drawn states directly and follows the fallback chain otherwise", () => {
    for (const state of [
      "idle",
      "walking",
      "celebrating",
      "level-up",
      "sleeping",
      "thinking",
      "surprised",
      "studying",
    ] as const) {
      expect(resolveCharacterState(state)).toBe(state);
    }
    expect(resolveCharacterState("running")).toBe("walking");
    expect(resolveCharacterState("working")).toBe("idle");
    expect(resolveCharacterState("exercising")).toBe("idle");
  });

  it("returns one-shot states to a drawn loop", () => {
    for (const [name, state] of Object.entries(SPRITE_SHEETS.adventurer.states)) {
      if (state.loop) continue;
      expect("next" in state, name).toBe(true);
      if ("next" in state) expect(DRAWN).toContain(state.next);
    }
  });
});
