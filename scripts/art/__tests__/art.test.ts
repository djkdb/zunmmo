import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ADVENTURER } from "../../../art/characters/adventurer";
import { GLYPHS, ICONS } from "../../../art/icons";
import { LIFE_32, OUTFIT_PRESETS } from "../../../art/palette";
import { checkPng } from "../check";
import { ArtError, createCanvas, encodePng, validateGrid } from "../lib";

const ROOT = join(import.meta.dirname, "..", "..", "..");

describe("art sources", () => {
  it("LIFE-32 has exactly 32 unique codes and colors", () => {
    expect(LIFE_32).toHaveLength(32);
    expect(new Set(LIFE_32.map((c) => c.code)).size).toBe(32);
    expect(new Set(LIFE_32.map((c) => c.hex)).size).toBe(32);
  });

  it("outfit presets only reference LIFE-32 codes", () => {
    const codes = new Set<string>(LIFE_32.map((c) => c.code));
    for (const ramp of Object.values(OUTFIT_PRESETS)) {
      for (const code of ramp) expect(codes.has(code)).toBe(true);
    }
  });

  it.each(Object.entries(ICONS))("icon %s is a valid 16×16 grid", (name, grid) => {
    expect(() => validateGrid(name, grid, { w: 16, h: 16 })).not.toThrow();
  });

  it.each(Object.entries(ICONS))("icon %s keeps a 1ap margin (PIXEL_RULES §1.1)", (_, grid) => {
    expect(grid[0]).toMatch(/^\.+$/);
    expect(grid[15]).toMatch(/^\.+$/);
    for (const row of grid) {
      expect(row[0]).toBe(".");
      expect(row[15]).toBe(".");
    }
  });

  it.each(Object.entries(GLYPHS))("glyph %s is a valid 8×8 grid", (name, grid) => {
    expect(() => validateGrid(name, grid, { w: 8, h: 8 })).not.toThrow();
  });

  it("character frames are 32×32 and share the feet baseline at y=30", () => {
    for (const state of Object.values(ADVENTURER.states)) {
      for (const frame of state.frames) {
        expect(() => validateGrid("adventurer", frame, ADVENTURER.frameSize, true)).not.toThrow();
        expect(frame[ADVENTURER.anchor.y]).not.toMatch(/^\.+$/);
        expect(frame[ADVENTURER.anchor.y + 1]).toMatch(/^\.+$/);
      }
    }
  });

  it("rejects wrong sizes and unknown codes", () => {
    expect(() => validateGrid("bad", ["..", "."], { w: 2, h: 2 })).toThrow(ArtError);
    expect(() => validateGrid("bad", [".Z", ".."], { w: 2, h: 2 })).toThrow(/unknown palette code/);
    expect(() => validateGrid("bad", ["1.", ".."], { w: 2, h: 2 })).toThrow(ArtError);
  });
});

describe("palette checker", () => {
  it("passes every shipped PNG", () => {
    for (const file of [
      "public/icons/icons.png",
      "public/icons/glyphs.png",
      "public/sprites/characters/adventurer-royal.png",
      "src/app/icon.png",
    ]) {
      expect(checkPng(readFileSync(join(ROOT, file)))).toEqual([]);
    }
  });

  it("flags off-palette and semi-transparent pixels", () => {
    const canvas = createCanvas(2, 1);
    canvas.data.set([255, 0, 255, 255, 13, 10, 20, 128]);
    const problems = checkPng(encodePng(canvas));
    expect(problems.some((p) => p.includes("off-palette"))).toBe(true);
    expect(problems.some((p) => p.includes("semi-transparent"))).toBe(true);
  });
});
