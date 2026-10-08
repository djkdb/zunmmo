"use client";

import type { ReactNode } from "react";

import { PixelFrame } from "@/components/pixel/PixelFrame";
import { cn } from "@/lib/utils/cn";

export interface Choice<T extends string> {
  value: T;
  label: ReactNode;
  /** Accessible name when `label` is visual only. */
  ariaLabel?: string;
}

interface ChoiceGroupProps<T extends string> {
  legend: string;
  name: string;
  value: T;
  onChange: (value: T) => void;
  choices: ReadonlyArray<Choice<T>>;
  columns?: 2 | 3 | 4 | 5;
  error?: string;
}

const COLUMNS = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4", 5: "grid-cols-5" } as const;

/** Radio group drawn as pixel cards (quest type, stat, …). Native radios keep keyboard/a11y. */
export function ChoiceGroup<T extends string>({
  legend,
  name,
  value,
  onChange,
  choices,
  columns = 4,
  error,
}: ChoiceGroupProps<T>) {
  return (
    <fieldset className="flex flex-col gap-2" aria-invalid={error ? true : undefined}>
      <legend className="mb-1 text-small font-semibold text-text-secondary">{legend}</legend>
      <div className={cn("grid gap-3", COLUMNS[columns])}>
        {choices.map((choice) => (
          <label key={choice.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={choice.value}
              checked={value === choice.value}
              onChange={() => onChange(choice.value)}
              aria-label={choice.ariaLabel}
              className="peer sr-only"
            />
            <PixelFrame
              flat
              selected={value === choice.value}
              variant={value === choice.value ? "raised" : "surface"}
              className="flex min-h-11 flex-col items-center justify-center gap-1 px-1 py-2 text-center text-caption"
            >
              {choice.label}
            </PixelFrame>
          </label>
        ))}
      </div>
      {error && <p className="text-caption text-danger-text">{error}</p>}
    </fieldset>
  );
}
