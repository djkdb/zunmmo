/** Integer pixel scales only (PIXEL_RULES §1.2). */
export type PixelScale = 2 | 3 | 4 | 5 | 6;

/**
 * `"inherit"` sizes art from the nearest `--pixel-scale` CSS variable, so one element can
 * switch scale per breakpoint (e.g. hero 3× → 4× → 5×) without rendering duplicates.
 */
export type ScaleProp = PixelScale | "inherit";

/** Length of `n` art pixels at `scale`, as a CSS length. */
export function ap(n: number, scale: ScaleProp): string {
  return scale === "inherit" ? `calc(${n}px * var(--pixel-scale, 4))` : `${n * scale}px`;
}
