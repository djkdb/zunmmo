"use client";

import { useActionState, useState } from "react";

import { QUEST_TYPE_META } from "@/components/game/quest-meta";
import { PixelButton } from "@/components/pixel/PixelButton";
import { PixelFrame } from "@/components/pixel/PixelFrame";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import {
  QUEST_TEMPLATES,
  type QuestTemplate,
  STARTER_TEMPLATE_IDS,
  TEMPLATE_GROUPS,
  describeRepeat,
} from "@/lib/game";

import { type QuestFormState, createQuestsFromTemplates } from "../actions";
import { MAX_STARTER_QUESTS } from "../schemas";

const VISIBLE_PER_GROUP = 3;
const isStarter = (id: string) => (STARTER_TEMPLATE_IDS as readonly string[]).includes(id);

/** Onboarding step 2: pick up to five first quests from GM templates (GAME_MASTER §5). */
export function StarterQuestsForm() {
  const [state, action, pending] = useActionState<QuestFormState, FormData>(
    createQuestsFromTemplates,
    null,
  );
  const [picked, setPicked] = useState<string[]>([...STARTER_TEMPLATE_IDS]);
  const full = picked.length >= MAX_STARTER_QUESTS;

  function card(t: QuestTemplate) {
    const checked = picked.includes(t.id);
    return (
      <label key={t.id} className="cursor-pointer">
        <input
          type="checkbox"
          name="template"
          value={t.id}
          checked={checked}
          disabled={!checked && full}
          onChange={() => toggle(t.id)}
          className="peer sr-only"
        />
        <PixelFrame
          flat
          selected={checked}
          variant={checked ? "raised" : "surface"}
          className="flex min-h-14 items-center gap-3 px-3 py-2"
        >
          <PixelIcon name={QUEST_TYPE_META[t.type].icon} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-small font-semibold">{t.title}</span>
            <span className="text-caption text-text-muted">
              {QUEST_TYPE_META[t.type].ko}
              {t.repeat ? ` · ${describeRepeat(t.repeat)}` : ""}
            </span>
          </span>
          <span aria-hidden className="font-pixel text-pixel text-accent">
            {checked ? "✓" : ""}
          </span>
        </PixelFrame>
      </label>
    );
  }

  function toggle(id: string) {
    setPicked((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : full ? cur : [...cur, id],
    );
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <p className="text-small text-text-muted" aria-live="polite">
        {picked.length}/{MAX_STARTER_QUESTS}개 골랐어요
        {full ? " — 더 고르려면 하나를 빼 주세요." : "."}
      </p>
      {TEMPLATE_GROUPS.map((group) => {
        // Starters first; three per group up front, the rest one tap away.
        const templates = QUEST_TEMPLATES.filter((t) => group.categories.includes(t.category)).sort(
          (a, b) => Number(isStarter(b.id)) - Number(isStarter(a.id)),
        );
        const shown = templates.slice(0, VISIBLE_PER_GROUP);
        const more = templates.slice(VISIBLE_PER_GROUP);
        return (
          <fieldset key={group.label} className="flex flex-col gap-2">
            <legend className="mb-1 text-small font-semibold text-text-secondary">
              {group.label}
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">{shown.map(card)}</div>
            {more.length > 0 && (
              <details className="flex flex-col">
                <summary className="flex min-h-11 cursor-pointer items-center text-small text-primary-text">
                  {group.label} 더 보기 ({more.length})
                </summary>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">{more.map(card)}</div>
              </details>
            )}
          </fieldset>
        );
      })}

      {state && !state.ok && (
        <p role="alert" className="text-small text-danger-text">
          {state.error.message}
        </p>
      )}

      <div className="sticky bottom-4 flex flex-col gap-2">
        <PixelButton type="submit" variant="accent" size="lg" block loading={pending}>
          {picked.length ? `${picked.length}개로 모험 시작` : "빈 게시판으로 시작"}
        </PixelButton>
      </div>
    </form>
  );
}
