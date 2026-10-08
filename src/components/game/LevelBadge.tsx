import { cn } from "@/lib/utils/cn";

/** "Lv.24" in the 24px pixel face. */
export function LevelBadge({ level, className }: { level: number; className?: string }) {
  return (
    <span
      className={cn("font-pixel text-pixel-2x text-xp-text", className)}
      aria-label={`레벨 ${level}`}
    >
      Lv.{level}
    </span>
  );
}
