import Link from "next/link";

import { cn } from "@/lib/utils/cn";

/** Pixel label + optional count and "모두 보기" link for a dashboard section. */
export function SectionHeader({
  id,
  label,
  tone,
  meta,
  href,
  linkLabel = "모두 보기",
}: {
  id: string;
  label: string;
  tone: "main" | "daily" | "side" | "boss" | "muted";
  meta?: string;
  href?: string;
  linkLabel?: string;
}) {
  const toneClass = {
    main: "text-quest-main-text",
    daily: "text-quest-daily-text",
    side: "text-quest-side-text",
    boss: "text-quest-boss-text",
    muted: "text-text-muted",
  }[tone];
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 id={id} className={cn("font-pixel text-pixel", toneClass)}>
        {label}
      </h2>
      <div className="flex items-center gap-3">
        {meta && <span className="font-pixel text-pixel text-text-muted">{meta}</span>}
        {href && (
          <Link
            href={href}
            className="inline-flex min-h-11 items-center text-small text-primary-text hover:underline"
          >
            {linkLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
