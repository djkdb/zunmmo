"use client";

import { CharacterSprite, type OutfitPreset } from "@/components/game/character/CharacterSprite";
import { PixelFrame } from "@/components/pixel/PixelFrame";
import { cn } from "@/lib/utils/cn";

import { OUTFITS, OUTFIT_LABELS } from "../schemas";

/** Outfit presets as pixel radio cards (onboarding and settings). */
export function OutfitPicker({
  value,
  onChange,
}: {
  value: OutfitPreset;
  onChange: (outfit: OutfitPreset) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-small font-semibold text-text-secondary">외형</legend>
      <div className="grid grid-cols-4 gap-3">
        {OUTFITS.map((preset) => (
          <label key={preset} className="flex cursor-pointer flex-col items-center gap-1.5">
            <input
              type="radio"
              name="outfit"
              value={preset}
              checked={value === preset}
              onChange={() => onChange(preset)}
              className="peer sr-only"
            />
            <PixelFrame
              flat
              variant={value === preset ? "raised" : "surface"}
              selected={value === preset}
              className="flex w-full justify-center py-2"
            >
              <CharacterSprite outfit={preset} scale={2} label="" shadow={false} />
            </PixelFrame>
            <span
              className={cn("text-caption", value === preset ? "text-text" : "text-text-muted")}
            >
              {OUTFIT_LABELS[preset]}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
