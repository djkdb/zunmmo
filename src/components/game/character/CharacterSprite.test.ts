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

  it("has every state drawn (Phase 8 + persona backlog)", () => {
    for (const state of CHARACTER_STATES) {
      expect(resolveCharacterState(state)).toBe(state);
    }
  });

  it("returns one-shot states to a drawn loop", () => {
    for (const [name, state] of Object.entries(SPRITE_SHEETS.adventurer.states)) {
      if (state.loop) continue;
      expect("next" in state, name).toBe(true);
      if ("next" in state) expect(DRAWN).toContain(state.next);
    }
  });
});
