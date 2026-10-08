import Link from "next/link";

import { QUEST_TEMPLATES, TEMPLATE_GROUPS } from "@/lib/game";
import { cn } from "@/lib/utils/cn";

/** GM templates as link chips; picking one pre-fills the quick-add form (GAME_MASTER §5). */
export function TemplatePicker({ selected }: { selected?: string }) {
  return (
    <details className="rounded-sm border border-border p-4">
      <summary className="flex min-h-11 cursor-pointer items-center text-small font-semibold text-text-secondary">
        GM 템플릿에서 고르기
      </summary>
      <div className="mt-3 flex flex-col gap-4">
        {TEMPLATE_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-2">
            <h2 className="text-caption text-text-muted">{group.label}</h2>
            <ul className="flex flex-wrap gap-2">
              {QUEST_TEMPLATES.filter((t) => group.categories.includes(t.category)).map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/quests/new?template=${t.id}`}
                    scroll={false}
                    aria-current={selected === t.id ? "true" : undefined}
                    className={cn(
                      "inline-flex min-h-11 items-center rounded-sm border px-3 text-small",
                      selected === t.id
                        ? "border-accent bg-surface-raised text-text"
                        : "border-border-strong text-text-secondary hover:text-text",
                    )}
                  >
                    {t.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}
