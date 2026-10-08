import type { ComponentPropsWithRef, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

import { PixelSpinner } from "./PixelSpinner";

export type PixelButtonVariant = "default" | "accent" | "primary";

interface PixelButtonProps extends ComponentPropsWithRef<"button"> {
  variant?: PixelButtonVariant;
  size?: "md" | "lg";
  icon?: ReactNode;
  loading?: boolean;
  /** Stretch to the container width (mobile CTA). */
  block?: boolean;
}

const SIZE_CLASSES = {
  md: "min-h-11 px-4 gap-2",
  lg: "min-h-14 px-6 gap-3",
} as const;

/**
 * Pixel button — drops onto its shadow when pressed (PIXEL_RULES §6.2).
 * Use `variant="accent"` for the single primary CTA on a screen.
 */
export function PixelButton({
  variant = "default",
  size = "md",
  icon,
  loading = false,
  block = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: PixelButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "pixel-btn inline-flex items-center justify-center font-pixel text-pixel uppercase",
        SIZE_CLASSES[size],
        block && "w-full",
        className,
      )}
      data-variant={variant === "default" ? undefined : variant}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <PixelSpinner label="처리 중" /> : icon}
      <span>{children}</span>
    </button>
  );
}
