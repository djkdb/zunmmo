"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils/cn";

export interface ToastOptions {
  message: string;
  tone?: "default" | "success" | "danger";
  /** Leading art, e.g. a badge medallion or the boss icon. */
  icon?: ReactNode;
  /** e.g. Undo for an optimistic completion (UI_GUIDE §5.3). */
  action?: { label: string; onClick: () => void };
  /** Milliseconds before auto-dismiss. */
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
}

const ToastContext = createContext<((options: ToastOptions) => void) | null>(null);

const DEFAULT_DURATION = 5000;
const MAX_VISIBLE = 3;

const TONE_CLASSES = {
  default: "border-border-strong",
  success: "border-success",
  danger: "border-danger",
} as const;

/** Toasts with an action (Undo) stay twice as long and pause while hovered or focused. */
const ACTION_DURATION = 10_000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((options: ToastOptions) => {
    const id = nextId.current++;
    setToasts((current) => [...current.slice(-(MAX_VISIBLE - 1)), { ...options, id }]);
  }, []);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-24 z-50 flex flex-col items-center gap-2 lg:right-6 lg:bottom-6 lg:left-auto lg:items-end"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false);
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  useEffect(() => {
    if (paused) return;
    const duration = toast.duration ?? (toast.action ? ACTION_DURATION : DEFAULT_DURATION);
    const timer = window.setTimeout(() => onDismissRef.current(), duration);
    return () => window.clearTimeout(timer);
  }, [paused, toast.duration, toast.action]);

  return (
    <div
      role="status"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-sm border border-l-4 bg-surface-raised px-4 py-3 text-small",
        TONE_CLASSES[toast.tone ?? "default"],
      )}
    >
      {toast.icon && (
        <span aria-hidden className="shrink-0">
          {toast.icon}
        </span>
      )}
      <span className="flex-1">{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          className="min-h-11 font-semibold text-primary-text hover:underline"
          onClick={() => {
            toast.action?.onClick();
            onDismiss();
          }}
        >
          {toast.action.label}
        </button>
      )}
    </div>
  );
}

export function useToast(): (options: ToastOptions) => void {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast must be used inside <ToastProvider>");
  return show;
}
