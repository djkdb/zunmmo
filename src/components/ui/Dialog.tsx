"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";

import { cn } from "@/lib/utils/cn";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** `sheet` slides up from the bottom on mobile and becomes a centered dialog from `md`. */
  variant?: "dialog" | "sheet";
  children?: ReactNode;
  footer?: ReactNode;
}

/**
 * Modal built on the native <dialog>: focus trap, ESC to close, inert background and
 * focus return come from the browser (UI_GUIDE §10).
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  variant = "dialog",
  children,
  footer,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // A click on the <dialog> element itself (not its content) is a backdrop click.
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "m-auto max-h-[85dvh] w-full max-w-md overflow-visible bg-transparent p-0 text-text",
        "backdrop:bg-ink-950/70",
        variant === "sheet" && "mb-0 max-w-none md:mb-auto md:max-w-md",
      )}
    >
      <div
        className={cn(
          "flex max-h-[85dvh] flex-col border border-border-strong bg-surface-raised",
          variant === "sheet" ? "rounded-t-sm md:rounded-sm" : "rounded-sm",
        )}
      >
        <header className="flex items-start justify-between gap-4 px-5 pt-5">
          <div className="flex flex-col gap-1">
            <h2 id={titleId} className="text-h2">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="text-small text-text-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mt-1 -mr-2 inline-flex size-11 items-center justify-center rounded-sm text-text-muted hover:bg-border hover:text-text"
            aria-label="닫기"
          >
            <span aria-hidden className="text-h2 leading-none">
              ×
            </span>
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <footer className="flex justify-end gap-3 border-t border-border px-5 py-4">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  );
}
