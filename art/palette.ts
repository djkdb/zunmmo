/**
 * LIFE-32 sprite palette (design/COLOR_PALETTE.md §5).
 * Every sprite, icon and effect uses only these colors. Each color has a one-character
 * code used by the grid sources in this folder.
 */
export const LIFE_32 = [
  { code: "O", name: "ink-950", hex: "#0d0a14" },
  { code: "n", name: "ink-800", hex: "#221c33" },
  { code: "m", name: "ink-600", hex: "#3d3459" },
  { code: "g", name: "ink-400", hex: "#776c99" },
  { code: "w", name: "ink-200", hex: "#cfc8e6" },
  { code: "W", name: "ink-100", hex: "#eeeaf8" },
  { code: "P", name: "parchment-100", hex: "#f7efd9" },
  { code: "p", name: "parchment-300", hex: "#e6d3a8" },
  { code: "L", name: "parchment-500", hex: "#c4a46e" },
  { code: "l", name: "parchment-700", hex: "#7a5c35" },
  { code: "H", name: "parchment-900", hex: "#4f3a22" },
  { code: "b", name: "royal-300", hex: "#8aa9ff" },
  { code: "B", name: "royal-500", hex: "#4466d6" },
  { code: "N", name: "royal-700", hex: "#23347a" },
  { code: "s", name: "skin-a-light", hex: "#f6d2b4" },
  { code: "S", name: "skin-a-base", hex: "#e0a983" },
  { code: "y", name: "gold-200", hex: "#ffe58f" },
  { code: "Y", name: "gold-400", hex: "#f7b733" },
  { code: "o", name: "gold-600", hex: "#b06818" },
  { code: "e", name: "emerald-300", hex: "#6fdc98" },
  { code: "E", name: "emerald-500", hex: "#2a9d5e" },
  { code: "f", name: "emerald-700", hex: "#154f33" },
  { code: "t", name: "teal-300", hex: "#6ad8e0" },
  { code: "T", name: "teal-500", hex: "#23909f" },
  { code: "v", name: "violet-300", hex: "#bf98ff" },
  { code: "V", name: "violet-500", hex: "#7b4cd1" },
  { code: "r", name: "crimson-300", hex: "#ff7f7f" },
  { code: "R", name: "crimson-500", hex: "#c9333f" },
  { code: "M", name: "crimson-700", hex: "#7f1d2d" },
  { code: "A", name: "ember-400", hex: "#f98b3c" },
  { code: "k", name: "skin-a-shade", hex: "#b9785a" },
  { code: "K", name: "skin-a-deep", hex: "#7d4a36" },
] as const;

export type PaletteCode = (typeof LIFE_32)[number]["code"];

export const TRANSPARENT = ".";

/**
 * Outfit palette-swap slots used by character grids: "1" light, "2" base, "3" shade.
 * Each preset is a hue-shifted ramp from LIFE-32 (CHARACTER_GUIDE §3).
 */
export const OUTFIT_SLOTS = ["1", "2", "3"] as const;

export const OUTFIT_PRESETS = {
  royal: ["b", "B", "N"],
  emerald: ["e", "E", "f"],
  violet: ["v", "V", "m"],
  ember: ["Y", "A", "o"],
} as const satisfies Record<string, readonly [PaletteCode, PaletteCode, PaletteCode]>;

export type OutfitPreset = keyof typeof OUTFIT_PRESETS;
