import { STAT_META } from "@/components/game/quest-meta";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { cn } from "@/lib/utils/cn";
import { formatGameDate, formatXpGain } from "@/lib/utils/format";

import type { XpLogView } from "../queries";

const REASON_LABEL: Record<XpLogView["reason"], string> = {
  quest_complete: "퀘스트 완료",
  goal_clear: "퀘스트라인 클리어",
  achievement: "업적",
  streak_bonus: "연속 모험",
  reversal: "완료 취소",
  admin_adjust: "조정",
};

/** The XP ledger, newest first — a plain data list (Modern side of the art direction). */
export function RecentXpList({ logs }: { logs: XpLogView[] }) {
  return (
    <ul className="flex flex-col">
      {logs.map((log) => (
        <li
          key={log.id}
          className="flex min-h-12 items-center gap-3 border-b border-border py-2 last:border-b-0"
        >
          {log.stat ? (
            <PixelIcon name={STAT_META[log.stat].icon} />
          ) : (
            <PixelIcon name={log.reason === "goal_clear" ? "quest-main" : "ui-sword"} />
          )}
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-small">{log.title}</span>
            <span className="text-caption text-text-muted">
              {REASON_LABEL[log.reason]}
              {log.gameDate && ` · ${formatGameDate(log.gameDate)}`}
            </span>
          </span>
          <span
            className={cn(
              "font-pixel text-pixel whitespace-nowrap",
              log.amount >= 0 ? "text-xp-text" : "text-text-muted",
            )}
          >
            {formatXpGain(log.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
}
