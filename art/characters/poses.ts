import type { PixelGrid } from "../types";

/**
 * Small, reviewable edits on top of a base frame, so every pose stays on the same body
 * (CHARACTER_GUIDE §2: shared silhouette, feet on y=30).
 */

/** Overwrite single pixels: [x, y, code]. */
export function edit(
  base: PixelGrid,
  pixels: ReadonlyArray<readonly [number, number, string]>,
): string[] {
  const rows = base.map((row) => [...row]);
  for (const [x, y, code] of pixels) {
    const row = rows[y];
    if (!row || x < 0 || x >= row.length) throw new Error(`edit out of bounds at (${x}, ${y})`);
    row[x] = code;
  }
  return rows.map((row) => row.join(""));
}

/** Stamp a patch at (x, y); "." in the patch keeps the base pixel. */
export function stamp(base: PixelGrid, patch: readonly string[], x: number, y: number): string[] {
  const pixels: Array<[number, number, string]> = [];
  patch.forEach((row, dy) =>
    [...row].forEach((code, dx) => {
      if (code !== ".") pixels.push([x + dx, y + dy, code]);
    }),
  );
  return edit(base, pixels);
}
