"use client";

import { type ComponentPropsWithRef, useId } from "react";

import { cn } from "@/lib/utils/cn";

interface SelectProps extends Omit<ComponentPropsWithRef<"select">, "id"> {
  label: string;
  hint?: string;
  error?: string;
}

/** Native select (best mobile UX), styled like TextField. */
export function Select({ label, hint, error, className, children, ...props }: SelectProps) {
  const id = useId();
  const describedBy = [hint && !error ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-small font-semibold text-text-secondary">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cn(
          "min-h-11 w-full rounded-sm border bg-bg px-3 text-body text-text",
          "focus-visible:border-focus focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus",
          error ? "border-danger" : "border-border-strong",
        )}
        {...props}
      >
        {children}
      </select>
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
