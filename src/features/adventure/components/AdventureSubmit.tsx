"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { PixelButton, type PixelButtonVariant } from "@/components/pixel/PixelButton";

/** Submit button for the adventure forms; shows the pixel spinner while the GM picks. */
export function AdventureSubmit({
  children,
  variant = "default",
  size = "md",
  block,
  icon,
}: {
  children: ReactNode;
  variant?: PixelButtonVariant;
  size?: "md" | "lg";
  block?: boolean;
  icon?: ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <PixelButton
      type="submit"
      variant={variant}
      size={size}
      block={block}
      icon={icon}
      loading={pending}
    >
      {children}
    </PixelButton>
  );
}
