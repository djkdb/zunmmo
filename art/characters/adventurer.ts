import type { PixelGrid } from "../types";

/**
 * Base adventurer — 32×32 frames, feet baseline y=30, center x=16 (CHARACTER_GUIDE §2).
 * Outfit pixels use palette-swap slots "1" (light) / "2" (base) / "3" (shade);
 * the build script renders one sheet per OUTFIT_PRESET.
 */

/** Rest pose. */
const STAND: PixelGrid = [
  "................................",
  "................................",
  "................................",
  "...........OOOOOOOOOO...........",
  "..........OlLLLlllllHO..........",
  ".........OlLLllllllllHO.........",
  ".........OllllllllllHHO.........",
  ".........OlllHlllHllHHO.........",
  ".........OllSlSSSlSSlHO.........",
  ".........OllssSSSSSSSHO.........",
  ".........OllsSOSSSOSSkO.........",
  ".........OllSSOSSSOSSkO.........",
  ".........OlSSrSSSSSrSkO.........",
  ".........OlSSSSSKSSSSkO.........",
  ".........OlkSSSSSSSSkkO.........",
  "..........OOOOOOOOOOOO..........",
  ".........O112223322223O.........",
  "........O1112w2w22L2233O........",
  "........O1232w2w2L22323O........",
  "........O1232222L222323O........",
  "........O123222L2222323O........",
  "........O233llL22223333O........",
  "........OsS3LLl333333SkO........",
  ".........OOOlllYYlllOOO.........",
  "...........OgmmmmmmnO...........",
  "...........OgmmOmmmnO...........",
  "...........OgmmOmmmnO...........",
  "...........OgmnOgmmnO...........",
  "..........OlHHHOlHHHHO..........",
  "..........OHHHHOHHHHHO..........",
  "...........OOOO.OOOOO...........",
  "................................",
];

/** Breath in: head dips 1ap into the hoodie. */
const BREATH_HEAD: PixelGrid = [
  "................................",
  "................................",
  "................................",
  "................................",
  "...........OOOOOOOOOO...........",
  "..........OlLLLlllllHO..........",
  ".........OlLLllllllllHO.........",
  ".........OllllllllllHHO.........",
  ".........OlllHlllHllHHO.........",
  ".........OllSlSSSlSSlHO.........",
  ".........OllssSSSSSSSHO.........",
  ".........OllsSOSSSOSSkO.........",
  ".........OllSSOSSSOSSkO.........",
  ".........OlSSrSSSSSrSkO.........",
  ".........OlSSSSSKSSSSkO.........",
  ".........OlkSSSSSSSSkkO.........",
  "..........OOOOOOOOOOOO..........",
  "........O1112w2w22L2233O........",
  "........O1232w2w2L22323O........",
  "........O1232222L222323O........",
  "........O123222L2222323O........",
  "........O233llL22223333O........",
  "........OsS3LLl333333SkO........",
  ".........OOOlllYYlllOOO.........",
  "...........OgmmmmmmnO...........",
  "...........OgmmOmmmnO...........",
  "...........OgmmOmmmnO...........",
  "...........OgmnOgmmnO...........",
  "..........OlHHHOlHHHHO..........",
  "..........OHHHHOHHHHHO..........",
  "...........OOOO.OOOOO...........",
  "................................",
];

/** Breath settle: head + upper torso 1ap lower (strap stays continuous). */
const BREATH_BODY: PixelGrid = [
  "................................",
  "................................",
  "................................",
  "................................",
  "...........OOOOOOOOOO...........",
  "..........OlLLLlllllHO..........",
  ".........OlLLllllllllHO.........",
  ".........OllllllllllHHO.........",
  ".........OlllHlllHllHHO.........",
  ".........OllSlSSSlSSlHO.........",
  ".........OllssSSSSSSSHO.........",
  ".........OllsSOSSSOSSkO.........",
  ".........OllSSOSSSOSSkO.........",
  ".........OlSSrSSSSSrSkO.........",
  ".........OlSSSSSKSSSSkO.........",
  ".........OlkSSSSSSSSkkO.........",
  "..........OOOOOOOOOOOO..........",
  ".........O112223322223O.........",
  "........O1112w2w22L2233O........",
  "........O1232w2w2L22323O........",
  "........O1232222L222323O........",
  "........O123222L2222323O........",
  "........OsS3LLl333333SkO........",
  ".........OOOlllYYlllOOO.........",
  "...........OgmmmmmmnO...........",
  "...........OgmmOmmmnO...........",
  "...........OgmmOmmmnO...........",
  "...........OgmnOgmmnO...........",
  "..........OlHHHOlHHHHO..........",
  "..........OHHHHOHHHHHO..........",
  "...........OOOO.OOOOO...........",
  "................................",
];

export interface SpriteStateSource {
  frames: readonly PixelGrid[];
  /** Milliseconds per frame. */
  durations: readonly number[];
  loop: boolean;
  /** State to return to after a non-looping state ends. */
  next?: string;
}

export const ADVENTURER = {
  id: "adventurer",
  frameSize: { w: 32, h: 32 },
  anchor: { x: 16, y: 30 },
  /** Sheet rows, in order. States not drawn yet resolve through `fallbacks`. */
  states: {
    idle: {
      frames: [STAND, BREATH_HEAD, BREATH_BODY, BREATH_HEAD],
      durations: [420, 220, 420, 220],
      loop: true,
    },
  } satisfies Record<string, SpriteStateSource>,
} as const;
