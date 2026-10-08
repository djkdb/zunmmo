"use client";

import { useActionState, useState } from "react";

import { CharacterSprite, type OutfitPreset } from "@/components/game/character/CharacterSprite";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { OutfitPicker } from "@/features/character/components/OutfitPicker";

import { updateCharacter } from "../actions";

export function CharacterSettingsForm({
  name,
  outfit: initialOutfit,
}: {
  name: string;
  outfit: OutfitPreset;
}) {
  const [state, action, pending] = useActionState(updateCharacter, null);
  const [outfit, setOutfit] = useState<OutfitPreset>(initialOutfit);
  const fieldError = (key: string) => (state ? state.error.fields?.[key] : undefined);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <CharacterSprite outfit={outfit} scale={3} label="외형 미리보기" />
        <TextField
          label="캐릭터 이름"
          name="name"
          defaultValue={state?.values?.name ?? name}
          maxLength={16}
          required
          autoComplete="nickname"
          error={fieldError("name")}
          className="flex-1"
        />
      </div>
      <OutfitPicker value={outfit} onChange={setOutfit} />
      {state && !state.error.fields && (
        <p role="alert" className="text-small text-danger-text">
          {state.error.message}
        </p>
      )}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "저장 중…" : "캐릭터 저장"}
        </Button>
      </div>
    </form>
  );
}
