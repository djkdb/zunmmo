"use client";

import { useActionState, useState } from "react";

import { CharacterSprite, type OutfitPreset } from "@/components/game/character/CharacterSprite";
import { PixelButton } from "@/components/pixel/PixelButton";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { TextField } from "@/components/ui/TextField";

import { type CreateCharacterState, createCharacter } from "../actions";
import { OutfitPicker } from "./OutfitPicker";

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

      <OutfitPicker value={outfit} onChange={setOutfit} />

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
