import { cn } from "@/lib/utils/cn";

/** Three-dot stepped spinner. Announces `label` to screen readers. */
export function PixelSpinner({
  label = "불러오는 중",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span role="status" className={cn("pixel-spinner", className)}>
      <span aria-hidden />
      <span aria-hidden />
      <span aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}
