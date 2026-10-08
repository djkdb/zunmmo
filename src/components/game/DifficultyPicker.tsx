"use client";

import { PixelGlyph } from "@/components/pixel/PixelIcon";
import { DIFFICULTIES, type Difficulty, type QuestType, questXp } from "@/lib/game";
import { cn } from "@/lib/utils/cn";
import { formatXpGain } from "@/lib/utils/format";

const GUIDE: Record<Difficulty, string> = {
  1: "15분 이내, 거의 부담 없음",
  2: "30분 내외",
  3: "1–2시간 집중",
  4: "반나절, 상당한 집중",
  5: "하루 이상 또는 큰 부담",
};

/** Difficulty as five pixel-star radios, with the resulting XP from the real rules. */
export function DifficultyPicker({
  value,
  onChange,
  type,
}: {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
  type: QuestType;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-small font-semibold text-text-secondary">난이도</legend>
      <div className="flex items-center gap-1">
        {DIFFICULTIES.map((d) => (
          <label
            key={d}
            className="relative inline-flex size-11 cursor-pointer items-center justify-center"
          >
            <input
              type="radio"
              name="difficulty"
              value={d}
              checked={value === d}
              onChange={() => onChange(d)}
              aria-label={`난이도 ${d}`}
              className="peer absolute inset-0 cursor-pointer opacity-0"
            />
            <span className="rounded-sm p-1 peer-focus-visible:outline-2 peer-focus-visible:outline-focus">
              <PixelGlyph name={d <= value ? "star" : "star-empty"} scale={3} />
            </span>
          </label>
        ))}
        <span className="ml-2 font-pixel text-pixel text-xp-text" aria-live="polite">
          {formatXpGain(questXp(type, value))}
        </span>
      </div>
      <p className={cn("text-caption text-text-muted")}>{GUIDE[value]}</p>
    </fieldset>
  );
}
