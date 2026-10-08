import type { ComponentPropsWithRef } from "react";

import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "secondary" | "ghost" | "link" | "danger";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  secondary: "bg-surface-raised text-text border border-border-strong hover:bg-border",
  ghost: "text-text-secondary hover:bg-surface-raised hover:text-text",
  link: "text-primary-text underline-offset-4 hover:underline px-1",
  danger: "text-danger-text border border-danger hover:bg-surface-raised",
};

interface ButtonProps extends ComponentPropsWithRef<"button"> {
  variant?: ButtonVariant;
}

/**
 * Modern (non-pixel) button for secondary actions, forms and settings.
 * The screen's primary game CTA uses <PixelButton variant="accent"> instead.
 */
export function Button({
  variant = "secondary",
  type = "button",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-4 text-small font-semibold",
        "transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}
