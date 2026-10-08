import type { PixelGrid } from "../types";

import { edit, stamp } from "./poses";

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

/** Walk (front-facing): left foot lifted, body settles 1ap. */
const STEP_LEFT: PixelGrid = [
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
  "...........OgmnOmmmnO...........",
  "..........OlHHHOgmmnO...........",
  "..........OHHHHOlHHHHO..........",
  "...........OOOOOHHHHHO..........",
  "................OOOOO...........",
  "................................",
];

/** Walk (front-facing): right foot lifted, body settles 1ap. */
const STEP_RIGHT: PixelGrid = [
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
  "...........OgmmOgmnnO...........",
  "...........OgmnOlHHHHO..........",
  "..........OlHHHOHHHHHO..........",
  "..........OHHHHOOOOOO...........",
  "...........OOOO.................",
  "................................",
];

// ───────── Phase 8 poses (built from STAND with small edits) ─────────
// Face landmarks on STAND: eyes (14,10–11) and (18,10–11), mouth (16,13), hands (9–10,22) / (21–22,22).

/**
 * Raised arms, rows 6–16. The left arm sits at x=6..9 and the right at x=22..25 so each
 * shares the head's outline column instead of doubling it. Light comes from the top-left,
 * so both sleeves are lit on their left edge.
 */
const ARM_LEFT: readonly string[] = [
  ".OO.",
  "OsSO",
  "OSkO",
  "O12O",
  "O12O",
  "O12O",
  "O12O",
  "O12O",
  "O13O",
  "O13O",
  "O13O",
];
const ARM_RIGHT: readonly string[] = ARM_LEFT.map((row) =>
  row.replace("12", "23").replace("13", "33"),
);
/** Hand one pixel lower — the wave's down beat. */
const lower = (arm: readonly string[]) => ["....", ...arm.slice(0, -1)];

/** Hands leave the hem when the arms go up. */
const HANDS_AWAY = [
  [9, 22, "3"],
  [10, 22, "3"],
  [21, 22, "3"],
  [22, 22, "3"],
] as const;

const OPEN_SMILE = [
  [15, 13, "K"],
  [16, 13, "K"],
  [17, 13, "K"],
  [16, 14, "r"],
] as const;

function armsUp(low: boolean): string[] {
  const withLeft = stamp(STAND, low ? lower(ARM_LEFT) : ARM_LEFT, 6, 6);
  const withBoth = stamp(withLeft, low ? lower(ARM_RIGHT) : ARM_RIGHT, 22, 6);
  return edit(withBoth, [...HANDS_AWAY, ...OPEN_SMILE]);
}

const CHEER_UP = armsUp(false);
const CHEER_LOW = armsUp(true);

/** Four-point sparkle (effect pixels, no outline — PIXEL_RULES §5 effects). */
const SPARK: readonly string[] = [".y.", "yWy", ".y."];
const SPARK_SMALL: readonly string[] = ["Y"];

function sparkles(
  base: PixelGrid,
  at: ReadonlyArray<readonly [number, number]>,
  small = false,
): string[] {
  return at.reduce<string[]>(
    (grid, [x, y]) => stamp(grid, small ? SPARK_SMALL : SPARK, x, y),
    [...base],
  );
}

const CELEBRATE_FRAMES = [
  CHEER_UP,
  sparkles(CHEER_LOW, [
    [1, 2],
    [28, 10],
  ]),
  sparkles(CHEER_UP, [
    [2, 14],
    [27, 1],
  ]),
  sparkles(
    CHEER_LOW,
    [
      [1, 2],
      [28, 10],
      [3, 20],
    ],
    true,
  ),
  sparkles(CHEER_UP, [
    [27, 18],
    [2, 8],
  ]),
  CHEER_UP,
];

/** Level-up: arms up while a ring of sparks circles the hero. */
const RING: ReadonlyArray<readonly [number, number]> = [
  [14, 0],
  [27, 3],
  [28, 14],
  [26, 24],
  [2, 24],
  [0, 14],
  [2, 3],
];
const LEVEL_UP_FRAMES = [
  ...RING.slice(0, 6).map((_, i) =>
    sparkles(i % 2 ? CHEER_LOW : CHEER_UP, [RING[i]!, RING[(i + 3) % RING.length]!]),
  ),
  sparkles(CHEER_UP, RING, true),
  CHEER_UP,
];

/** Closed eyes and a small mouth. */
const ASLEEP = edit(STAND, [
  [14, 10, "S"],
  [18, 10, "S"],
  [13, 11, "K"],
  [14, 11, "K"],
  [18, 11, "K"],
  [19, 11, "K"],
  [16, 13, "k"],
]);
const Z_BIG: readonly string[] = ["wwww", "..w.", ".w..", "wwww"];
const Z_SMALL: readonly string[] = ["ww", ".w", "ww"];
const SLEEP_FRAMES = [
  stamp(ASLEEP, Z_SMALL, 24, 6),
  stamp(stamp(ASLEEP, Z_SMALL, 24, 5), Z_BIG, 26, 1),
  stamp(ASLEEP, Z_BIG, 25, 2),
  stamp(ASLEEP, Z_SMALL, 25, 4),
];

/** Pupils up, with a growing thought bubble. */
const LOOK_UP = edit(STAND, [
  [14, 9, "O"],
  [14, 11, "S"],
  [18, 9, "O"],
  [18, 11, "S"],
  [16, 13, "k"],
]);
const BUBBLE_ONE_DOT: readonly string[] = [".OOOOO.", "OWWWWWO", "OWgWWWO", "OWWWWWO", ".OOOOO."];
const BUBBLE_TWO_DOTS: readonly string[] = [".OOOOO.", "OWWWWWO", "OWgWgWO", "OWWWWWO", ".OOOOO."];
const THINK_FRAMES = [
  edit(LOOK_UP, [[23, 9, "w"]]),
  edit(LOOK_UP, [
    [23, 9, "w"],
    [24, 7, "w"],
  ]),
  stamp(
    edit(LOOK_UP, [
      [23, 9, "w"],
      [24, 7, "w"],
    ]),
    BUBBLE_ONE_DOT,
    24,
    1,
  ),
  stamp(
    edit(LOOK_UP, [
      [23, 9, "w"],
      [24, 7, "w"],
    ]),
    BUBBLE_TWO_DOTS,
    24,
    1,
  ),
];

/** Wide eyes, round mouth, "!" above the head. */
const WIDE_EYED = edit(STAND, [
  [14, 9, "O"],
  [18, 9, "O"],
  [16, 13, "O"],
  [16, 14, "K"],
]);
const BANG: readonly string[] = [".O.", "OYO", "OYO", "OYO", ".O.", "OYO", ".O."];
const SURPRISE_FRAMES = [WIDE_EYED, stamp(WIDE_EYED, BANG, 24, 2), stamp(WIDE_EYED, BANG, 24, 1)];

/** Open book held at the chest, eyes down; the last frame turns a page. */
const BOOK: readonly string[] = [
  "OOOOOOOOOO",
  "sWWwWgWwWs",
  "sWwWWgwWWs",
  "OWWwWgWwWO",
  ".OOOOOOOO.",
];
const BOOK_FLIP: readonly string[] = [
  "OOOOOOOOOO",
  "sWWwWgWWWs",
  "sWwWWgWWWs",
  "OWWwWgWWWO",
  ".OOOOOOOO.",
];
const READING = edit(stamp(STAND, BOOK, 11, 19), [
  [14, 10, "S"],
  [18, 10, "S"],
  [9, 22, "3"],
  [10, 22, "3"],
  [21, 22, "3"],
  [22, 22, "3"],
]);
const STUDY_FRAMES = [
  READING,
  READING,
  edit(READING, [[16, 13, "k"]]),
  stamp(READING, BOOK_FLIP, 11, 19),
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
    walking: {
      frames: [STAND, STEP_LEFT, STAND, STEP_RIGHT],
      durations: [150, 150, 150, 150],
      loop: true,
    },
    celebrating: {
      frames: CELEBRATE_FRAMES,
      durations: [90, 90, 90, 90, 120, 200],
      loop: false,
      next: "idle",
    },
    "level-up": {
      frames: LEVEL_UP_FRAMES,
      durations: [80, 80, 80, 80, 80, 80, 150, 300],
      loop: false,
      next: "idle",
    },
    sleeping: {
      frames: SLEEP_FRAMES,
      durations: [400, 400, 400, 400],
      loop: true,
    },
    thinking: {
      frames: THINK_FRAMES,
      durations: [250, 250, 250, 250],
      loop: true,
    },
    surprised: {
      frames: SURPRISE_FRAMES,
      durations: [80, 80, 300],
      loop: false,
      next: "idle",
    },
    studying: {
      frames: STUDY_FRAMES,
      durations: [220, 220, 220, 220],
      loop: true,
    },
  } satisfies Record<string, SpriteStateSource>,
} as const;
