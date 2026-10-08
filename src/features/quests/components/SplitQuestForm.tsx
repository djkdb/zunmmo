"use client";

import { useActionState, useState } from "react";

import { PixelStars } from "@/components/pixel/PixelStars";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import {
  type Difficulty,
  MAX_SPLIT_PARTS,
  MIN_SPLIT_PARTS,
  type SplittableType,
  splitPlan,
} from "@/lib/game";
import { formatMinutes, formatXpGain } from "@/lib/utils/format";

import type { QuestFormState } from "../actions";
import { splitLines } from "../schemas";

interface SplitQuestFormProps {
  action: (state: QuestFormState, formData: FormData) => Promise<QuestFormState>;
  quest: {
    title: string;
    type: SplittableType;
    difficulty: Difficulty;
    xp: number;
    estimatedMinutes: number | null;
  };
  /** Opened from the GM's "too long for today" hint. */
  open: boolean;
}

/**
 * Break a too-big quest into steps, one per line. The preview shows what each part becomes
 * before saving: parts share the original's XP (splitPlan), so splitting never farms XP.
 */
export function SplitQuestForm({ action, quest, open }: SplitQuestFormProps) {
  const [state, formAction, pending] = useActionState<QuestFormState, FormData>(action, null);
  const [text, setText] = useState(state?.values?.steps ?? "");
  const lines = splitLines(text);
  const valid = lines.length >= MIN_SPLIT_PARTS && lines.length <= MAX_SPLIT_PARTS;
  const parts = valid ? splitPlan(quest, lines) : [];
  const total = parts.reduce((sum, p) => sum + p.xp, 0);

  return (
    <details id="split" className="rounded-sm border border-border p-4" open={open}>
      <summary className="flex min-h-11 cursor-pointer items-center text-small font-semibold text-text-secondary">
        단계로 나누기
      </summary>
      <form action={formAction} className="mt-4 flex flex-col gap-4">
        <p className="text-small text-text-muted">
          하루에 끝내기엔 큰 퀘스트라면 작은 단계로 나눠 봐요. 첫 단계가 이 퀘스트를 대신하고,
          나머지는 바로 뒤에 이어져요. 나눠도 받는 XP는 거의 같아요.
        </p>
        <Textarea
          label={`한 줄에 한 단계 (${MIN_SPLIT_PARTS}–${MAX_SPLIT_PARTS}줄)`}
          name="steps"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"결제 API 조사하기\n결제 화면 만들기\n결제 테스트하기"}
          error={state?.error.fields?.steps}
        />
        {parts.length > 0 && (
          <div aria-live="polite" className="flex flex-col gap-2">
            <ol className="flex flex-col">
              {parts.map((p, i) => (
                <li
                  key={`${i}-${p.title}`}
                  className="flex min-h-11 items-center gap-3 border-b border-border py-1 text-small last:border-b-0"
                >
                  <span className="w-5 font-pixel text-pixel text-text-muted">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{p.title}</span>
                  <PixelStars value={p.difficulty} />
                  {p.estimatedMinutes !== null && (
                    <span className="text-caption text-text-muted">
                      {formatMinutes(p.estimatedMinutes)}
                    </span>
                  )}
                  <span className="font-pixel text-pixel text-xp-text">{formatXpGain(p.xp)}</span>
                </li>
              ))}
            </ol>
            <p className="text-caption text-text-muted">
              합계 {formatXpGain(total)} (원래 {formatXpGain(quest.xp)})
            </p>
          </div>
        )}
        {state && !state.error.fields && (
          <p role="alert" className="text-small text-danger-text">
            {state.error.message}
          </p>
        )}
        <div>
          <Button type="submit" aria-disabled={pending || !valid || undefined} disabled={!valid}>
            {valid ? `${lines.length}단계로 나누기` : "단계를 두 줄 이상 적어 주세요"}
          </Button>
        </div>
      </form>
    </details>
  );
}
