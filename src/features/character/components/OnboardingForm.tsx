"use client";

import { useActionState, useState } from "react";

import { CharacterSprite, type OutfitPreset } from "@/components/game/character/CharacterSprite";
import { PixelButton } from "@/components/pixel/PixelButton";
import { PixelFrame } from "@/components/pixel/PixelFrame";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { TextField } from "@/components/ui/TextField";
import { cn } from "@/lib/utils/cn";

import { type CreateCharacterState, createCharacter } from "../actions";
import { OUTFITS, OUTFIT_LABELS } from "../schemas";

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const [state, action, pending] = useActionState<CreateCharacterState, FormData>(
    createCharacter,
    null,
  );
  const [outfit, setOutfit] = useState<OutfitPreset>("royal");
  const [name, setName] = useState(defaultName.slice(0, 16));
  const error = state && !state.ok ? state.error : null;

  return (
    <form action={action} className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-3">
        {/* Preview: 4× character with the chosen outfit */}
        <CharacterSprite
          outfit={outfit}
          scale={4}
          label={`${name || "모험가"}의 캐릭터 미리보기`}
        />
        <span className="min-h-7 font-pixel text-pixel-2x text-text">{name || "???"}</span>
        <span className="font-pixel text-pixel text-xp-text">Lv.1 견습 모험가</span>
      </div>

      <TextField
        label="캐릭터 이름"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={16}
        required
        autoComplete="nickname"
        hint="16자까지. 나중에 바꿀 수 있어요."
        error={error?.fields?.name}
      />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-small font-semibold text-text-secondary">외형</legend>
        <div className="grid grid-cols-4 gap-3">
          {OUTFITS.map((preset) => (
            <label key={preset} className="flex cursor-pointer flex-col items-center gap-1.5">
              <input
                type="radio"
                name="outfit"
                value={preset}
                checked={outfit === preset}
                onChange={() => setOutfit(preset)}
                className="peer sr-only"
              />
              <PixelFrame
                flat
                variant={outfit === preset ? "raised" : "surface"}
                selected={outfit === preset}
                className="flex w-full justify-center py-2"
              >
                <CharacterSprite outfit={preset} scale={2} label="" shadow={false} />
              </PixelFrame>
              <span
                className={cn("text-caption", outfit === preset ? "text-text" : "text-text-muted")}
              >
                {OUTFIT_LABELS[preset]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && !error.fields && (
        <p role="alert" className="text-small text-danger-text">
          {error.message}
        </p>
      )}

      <PixelButton
        type="submit"
        variant="accent"
        size="lg"
        block
        loading={pending}
        icon={<PixelIcon name="ui-sword" />}
      >
        모험 시작
      </PixelButton>
    </form>
  );
}
