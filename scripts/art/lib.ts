import { PNG } from "pngjs";

import {
  LIFE_32,
  OUTFIT_PRESETS,
  OUTFIT_SLOTS,
  type OutfitPreset,
  type PaletteCode,
  TRANSPARENT,
} from "../../art/palette";
import type { PixelGrid } from "../../art/types";

export type Rgba = readonly [number, number, number, number];

const CODE_TO_RGBA = new Map<string, Rgba>(
  LIFE_32.map(({ code, hex }) => [code, hexToRgba(hex)] as const),
);

export function hexToRgba(hex: string): Rgba {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff, 0xff];
}

/** Set of "r,g,b" keys for every LIFE-32 color — used by the palette checker. */
export const PALETTE_KEYS = new Set(LIFE_32.map(({ hex }) => hexToRgba(hex).slice(0, 3).join(",")));

export class ArtError extends Error {}

/** Validate a grid's size and codes. `allowOutfitSlots` permits "1"/"2"/"3" swap slots. */
export function validateGrid(
  name: string,
  grid: PixelGrid,
  size: { w: number; h: number },
  allowOutfitSlots = false,
): void {
  if (grid.length !== size.h) {
    throw new ArtError(`${name}: expected ${size.h} rows, got ${grid.length}`);
  }
  grid.forEach((row, y) => {
    if (row.length !== size.w) {
      throw new ArtError(`${name}: row ${y} has ${row.length} px, expected ${size.w}`);
    }
    for (const [x, code] of [...row].entries()) {
      const ok =
        code === TRANSPARENT ||
        CODE_TO_RGBA.has(code) ||
        (allowOutfitSlots && (OUTFIT_SLOTS as readonly string[]).includes(code));
      if (!ok) throw new ArtError(`${name}: unknown palette code "${code}" at (${x}, ${y})`);
    }
  });
}

function resolveCode(code: string, preset?: OutfitPreset): Rgba | null {
  if (code === TRANSPARENT) return null;
  const slot = (OUTFIT_SLOTS as readonly string[]).indexOf(code);
  if (slot >= 0) {
    if (!preset) throw new ArtError(`outfit slot "${code}" used without a preset`);
    const swapped: PaletteCode = OUTFIT_PRESETS[preset][slot]!;
    return CODE_TO_RGBA.get(swapped)!;
  }
  const rgba = CODE_TO_RGBA.get(code);
  if (!rgba) throw new ArtError(`unknown palette code "${code}"`);
  return rgba;
}

/** A blank RGBA canvas. */
export function createCanvas(width: number, height: number): PNG {
  const png = new PNG({ width, height, colorType: 6 });
  png.data.fill(0);
  return png;
}

/** Blit a grid into a canvas at (ox, oy), optionally scaled by an integer factor. */
export function drawGrid(
  canvas: PNG,
  grid: PixelGrid,
  ox: number,
  oy: number,
  options: { preset?: OutfitPreset; scale?: number } = {},
): void {
  const scale = options.scale ?? 1;
  grid.forEach((row, y) => {
    [...row].forEach((code, x) => {
      const rgba = resolveCode(code, options.preset);
      if (!rgba) return;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const i = ((oy + y * scale + dy) * canvas.width + (ox + x * scale + dx)) * 4;
          canvas.data[i] = rgba[0];
          canvas.data[i + 1] = rgba[1];
          canvas.data[i + 2] = rgba[2];
          canvas.data[i + 3] = rgba[3];
        }
      }
    });
  });
}

export function encodePng(canvas: PNG): Buffer {
  return PNG.sync.write(canvas, { colorType: 6 });
}

export function decodePng(buffer: Buffer): PNG {
  return PNG.sync.read(buffer);
}

/** Crop a sub-grid (used for the favicon head crop). */
export function cropGrid(grid: PixelGrid, x: number, y: number, w: number, h: number): string[] {
  return grid.slice(y, y + h).map((row) => row.slice(x, x + w));
}

/** Pad a grid with transparency to a target size, centered. */
export function padGrid(grid: PixelGrid, w: number, h: number): string[] {
  const gw = grid[0]?.length ?? 0;
  const left = Math.floor((w - gw) / 2);
  const top = Math.floor((h - grid.length) / 2);
  const blank = TRANSPARENT.repeat(w);
  const out = Array.from({ length: h }, () => blank);
  grid.forEach((row, y) => {
    out[top + y] = TRANSPARENT.repeat(left) + row + TRANSPARENT.repeat(w - left - row.length);
  });
  return out;
}
