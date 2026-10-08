import Link from "next/link";

import { PixelBar } from "@/components/pixel/PixelBar";
import type { QuestType } from "@/lib/game";
import { cn } from "@/lib/utils/cn";
import { formatXpGain } from "@/lib/utils/format";

export interface QuestlineStep {
  id: string;
  title: string;
  type: QuestType;
  xp: number;
  done: boolean;
}

interface QuestlineMapProps {
  title: string;
  ratio: number;
  steps: readonly QuestlineStep[];
  questHref: (id: string) => string;
}

const MAX_NODES = 10;

/**
 * Main Questline as a map strip (UI_GUIDE §5.2): cleared nodes gold, the next step highlighted,
 * the rest outlined. Progress is XP-weighted (GAME_SYSTEM §3) — the bar carries the number.
 */
export function QuestlineMap({ title, ratio, steps, questHref }: QuestlineMapProps) {
  const route = steps.filter((s) => s.type !== "daily");
  const next = route.find((s) => !s.done) ?? null;
  const nodes = route.slice(0, MAX_NODES);
  const percent = Math.round(ratio * 100);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="truncate text-title">{title}</h3>
        <span className="shrink-0 font-pixel text-pixel text-quest-main-text">{percent}%</span>
      </div>

      {nodes.length > 0 && (
        <ol aria-label="진행 단계" className="flex items-center">
          {nodes.map((step, i) => (
            <li key={step.id} className="flex flex-1 items-center last:flex-none">
              <span
                aria-label={`${step.title}${step.done ? " (완료)" : step === next ? " (다음 단계)" : ""}`}
                className={cn(
                  "size-3 shrink-0 border-2 border-outline",
                  step.done ? "bg-xp-fill" : step === next ? "bg-quest-main" : "bg-surface-raised",
                )}
              />
              {i < nodes.length - 1 && (
                <span
                  aria-hidden
                  className={cn("h-0.5 flex-1", step.done ? "bg-xp-fill" : "bg-border")}
                />
              )}
            </li>
          ))}
          {route.length > MAX_NODES && (
            <li className="ml-2 text-caption text-text-muted">+{route.length - MAX_NODES}</li>
          )}
        </ol>
      )}

      <PixelBar ratio={ratio} units={3} label={`${title} 진행률`} valueText={`${percent}%`} />

      {next ? (
        <p className="flex flex-wrap items-center gap-x-2 text-small">
          <span className="text-text-muted">다음:</span>
          <Link href={questHref(next.id)} className="text-text hover:underline">
            {next.title}
          </Link>
          <span className="font-pixel text-pixel text-xp-text">{formatXpGain(next.xp)}</span>
        </p>
      ) : (
        <p className="text-small text-text-muted">
          {route.length === 0
            ? "단계를 추가해 퀘스트라인을 시작해 봐."
            : "모든 단계 완료! 퀘스트라인 클리어가 눈앞이야."}
        </p>
      )}
    </div>
  );
}
