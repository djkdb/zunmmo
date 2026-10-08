import { z } from "zod";

import type { OutfitPreset } from "@/components/game/character/CharacterSprite";

/** Outfit presets offered at onboarding — must match the generated sprite sheets. */
export const OUTFITS = [
  "royal",
  "emerald",
  "violet",
  "ember",
] as const satisfies readonly OutfitPreset[];

export const OUTFIT_LABELS: Record<OutfitPreset, string> = {
  royal: "로열 블루",
  emerald: "에메랄드",
  violet: "바이올렛",
  ember: "엠버",
};

/** characters.appearance (design/CHARACTER_GUIDE.md §7). */
export const AppearanceSchema = z.object({
  version: z.literal(1),
  base: z.literal("adventurer"),
  skinTone: z.enum(["a", "b", "c"]),
  hair: z.object({ style: z.string(), color: z.enum(["brown", "black", "blonde", "red", "blue"]) }),
  outfit: z.object({ style: z.string(), color: z.enum(OUTFITS) }),
  accessory: z.string().nullable(),
});
export type Appearance = z.infer<typeof AppearanceSchema>;

export function defaultAppearance(outfit: OutfitPreset): Appearance {
  return {
    version: 1,
    base: "adventurer",
    skinTone: "a",
    hair: { style: "short", color: "brown" },
    outfit: { style: "hoodie", color: outfit },
    accessory: null,
  };
}

/** Outfit to render for a stored appearance; tolerant of older/invalid shapes. */
export function outfitOf(appearance: unknown): OutfitPreset {
  const parsed = AppearanceSchema.safeParse(appearance);
  return parsed.success ? parsed.data.outfit.color : "royal";
}

export const CharacterNameSchema = z
  .string()
  .trim()
  .min(1, "이름을 입력해 주세요.")
  .max(16, "이름은 16자까지 쓸 수 있어요.");

export const CreateCharacterSchema = z.object({
  name: CharacterNameSchema,
  outfit: z.enum(OUTFITS, "외형을 골라 주세요."),
});
