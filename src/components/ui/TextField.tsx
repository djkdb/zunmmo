"use client";

import { type ComponentPropsWithRef, useId } from "react";

import { cn } from "@/lib/utils/cn";

interface TextFieldProps extends Omit<ComponentPropsWithRef<"input">, "id"> {
  label: string;
  hint?: string;
  error?: string;
  multiline?: false;
}

const FIELD_CLASSES =
  "w-full rounded-sm border bg-bg px-3 text-body text-text placeholder:text-text-muted " +
  "transition-colors duration-150 focus-visible:border-focus focus-visible:outline-2 " +
  "focus-visible:outline-offset-0 focus-visible:outline-focus disabled:opacity-50";

/** Labelled text input (UI_GUIDE §6). The label is always visible — placeholders never replace it. */
export function TextField({ label, hint, error, className, ...props }: TextFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-small font-semibold text-text-secondary">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        className={cn(FIELD_CLASSES, "min-h-11", error ? "border-danger" : "border-border-strong")}
        {...props}
      />
      {hint && !error && (
        <p id={hintId} className="text-caption text-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-caption text-danger-text">
          {error}
        </p>
      )}
    </div>
  );
}
