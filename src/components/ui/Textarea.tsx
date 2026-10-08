"use client";

import { type ComponentPropsWithRef, useId } from "react";

import { cn } from "@/lib/utils/cn";

interface TextareaProps extends Omit<ComponentPropsWithRef<"textarea">, "id"> {
  label: string;
  hint?: string;
  error?: string;
}

export function Textarea({ label, hint, error, className, rows = 3, ...props }: TextareaProps) {
  const id = useId();
  const describedBy = [hint && !error ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-small font-semibold text-text-secondary">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cn(
          "w-full resize-y rounded-sm border bg-bg px-3 py-2.5 text-body text-text placeholder:text-text-muted",
          "focus-visible:border-focus focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus",
          error ? "border-danger" : "border-border-strong",
        )}
        {...props}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-caption text-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-caption text-danger-text">
          {error}
        </p>
      )}
    </div>
  );
}
