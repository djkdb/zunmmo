import Link from "next/link";
import type { ReactNode } from "react";

import { PixelFrame } from "@/components/pixel/PixelFrame";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { PixelStars } from "@/components/pixel/PixelStars";
import { PixelTag } from "@/components/pixel/PixelTag";
import type { Difficulty, GameDate, QuestType } from "@/lib/game";
import { cn } from "@/lib/utils/cn";
import { formatMinutes, formatXpGain } from "@/lib/utils/format";

import { type DeadlineTone, deadlineStatus } from "./deadline";
import { QUEST_TYPE_META } from "./quest-meta";
import { QuestTypeTag } from "./QuestTypeTag";

export interface QuestCardData {
  title: string;
  type: QuestType;
  difficulty: Difficulty;
  /** Snapshotted reward from `questXp()` — never recomputed in the UI. */
  xp: number;
  deadline?: GameDate;
  estimatedMinutes?: number;
  completed?: boolean;
  /** Deadline passed without completion — shown neutrally, never as a failure. */
  expired?: boolean;
}

const DEADLINE_TONE_CLASSES: Record<DeadlineTone, string> = {
  danger: "text-danger-text font-semibold",
  warning: "text-warning-text font-semibold",
  muted: "text-text-muted",
};

interface QuestCardProps {
  quest: QuestCardData;
  /** Today's game date, for D-day labels. */
  today: GameDate;
  /** Completion control (usually <CompleteButton>), kept as a slot so the card stays a server component. */
  action?: ReactNode;
  /** Makes the whole card open the quest (stretched link); the action stays separately clickable. */
  href?: string;
  className?: string;
}

/** Default quest card: type stripe, icon, title, meta row, XP reward and action (UI_GUIDE §5.3). */
export function QuestCard({ quest, today, action, href, className }: QuestCardProps) {
  const meta = QUEST_TYPE_META[quest.type];
  const deadline = quest.deadline ? deadlineStatus(quest.deadline, today) : null;

  return (
    <PixelFrame as="article" stripe={quest.type} className={cn("flex gap-3 py-3 pr-3", className)}>
      <PixelIcon name={meta.icon} className="mt-0.5" />
      <div className={cn("flex min-w-0 flex-1 flex-col gap-1.5", quest.completed && "opacity-60")}>
        <h3 className="line-clamp-2 text-title">
          {href ? (
            <Link
              href={href}
              className="after:absolute after:inset-0 hover:underline focus-visible:underline focus-visible:outline-none"
            >
              {quest.title}
            </Link>
          ) : (
            quest.title
          )}
        </h3>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-small">
          <QuestTypeTag type={quest.type} />
          <PixelStars value={quest.difficulty} />
          {deadline && !quest.completed && !quest.expired && (
            <span className={DEADLINE_TONE_CLASSES[deadline.tone]}>{deadline.label}</span>
          )}
          {quest.estimatedMinutes !== undefined && (
            <span className="text-text-muted">{formatMinutes(quest.estimatedMinutes)}</span>
          )}
          {quest.completed && <span className="font-semibold text-success-text">완료</span>}
          {quest.expired && <span className="text-text-muted">기한 만료</span>}
        </div>
      </div>
      <div className="relative z-10 flex shrink-0 flex-col items-end justify-between gap-2">
        <PixelTag tone="xp">{formatXpGain(quest.xp)}</PixelTag>
        {action}
      </div>
    </PixelFrame>
  );
}
