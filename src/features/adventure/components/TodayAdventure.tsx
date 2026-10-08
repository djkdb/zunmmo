import Link from "next/link";

import { CharacterSprite, type OutfitPreset } from "@/components/game/character/CharacterSprite";
import { deadlineStatus } from "@/components/game/deadline";
import { QUEST_TYPE_META } from "@/components/game/quest-meta";
import { PixelFrame } from "@/components/pixel/PixelFrame";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { QuestAction } from "@/features/quests/components/QuestAction";
import type { QuestView } from "@/features/quests/queries";
import type { GameDate } from "@/lib/game";
import { cn } from "@/lib/utils/cn";
import { formatMinutes, formatXpGain } from "@/lib/utils/format";

import { startAdventure } from "../actions";
import { AdventureSubmit } from "./AdventureSubmit";

export interface AdventureStep {
  quest: QuestView;
  done: boolean;
}

type TodayAdventureProps =
  | { state: "ready"; titles: string[]; totalXp: number; totalMinutes: number }
  | { state: "active"; steps: AdventureStep[]; briefing: string | null; today: GameDate }
  | {
      state: "done";
      steps: AdventureStep[];
      character: { name: string; outfit: OutfitPreset };
      /** More quests are open, so "더 모험하기" can pick a new set. */
      canContinue: boolean;
    }
  | { state: "rest" };

const LABEL = "TODAY'S ADVENTURE";

/**
 * The dashboard hero (UI_GUIDE §4.1–4.2): a parchment quest scroll that is a CTA before
 * the day starts, a numbered checklist while playing, and a small celebration at the end.
 */
export function TodayAdventure(props: TodayAdventureProps) {
  return (
    <PixelFrame
      as="section"
      variant="parchment"
      aria-labelledby="today-title"
      className="flex flex-col gap-4 p-5"
    >
      <h2
        id="today-title"
        className="flex items-center gap-2 font-pixel text-pixel text-on-parchment"
      >
        <PixelIcon name="ui-sword" />
        {LABEL}
      </h2>
      {props.state === "ready" && <Ready {...props} />}
      {props.state === "active" && <Active {...props} />}
      {props.state === "done" && <Done {...props} />}
      {props.state === "rest" && (
        <p className="text-body text-on-parchment-muted">
          오늘 남은 퀘스트가 없어. 쉬는 것도 모험이야.
        </p>
      )}
    </PixelFrame>
  );
}

function Ready({
  titles,
  totalXp,
  totalMinutes,
}: {
  titles: string[];
  totalXp: number;
  totalMinutes: number;
}) {
  return (
    <>
      <div className="flex flex-col gap-1">
        <p className="text-title">오늘의 모험이 기다리고 있어</p>
        <p className="text-small text-on-parchment-muted">
          추천 퀘스트 {titles.length}개 · {formatXpGain(totalXp)} · 약 {formatMinutes(totalMinutes)}
        </p>
      </div>
      <ul className="flex flex-col gap-1 text-small text-on-parchment-muted">
        {titles.slice(0, 3).map((title) => (
          <li key={title} className="truncate">
            · {title}
          </li>
        ))}
        {titles.length > 3 && <li>외 {titles.length - 3}개</li>}
      </ul>
      <form action={startAdventure}>
        <AdventureSubmit variant="accent" size="lg" block icon={<PixelIcon name="ui-sword" />}>
          START TODAY&apos;S ADVENTURE
        </AdventureSubmit>
      </form>
    </>
  );
}

function stepMeta(quest: QuestView, today: GameDate): string {
  const parts: string[] = [QUEST_TYPE_META[quest.type].ko];
  if (quest.deadline && quest.type !== "daily") {
    const d = deadlineStatus(quest.deadline, today);
    if (d.daysLeft <= 3) parts.push(d.label);
  }
  parts.push(formatXpGain(quest.xp));
  return parts.join(" · ");
}

function Active({
  steps,
  briefing,
  today,
}: {
  steps: AdventureStep[];
  briefing: string | null;
  today: GameDate;
}) {
  const done = steps.filter((s) => s.done).length;
  const remainingXp = steps.filter((s) => !s.done).reduce((sum, s) => sum + s.quest.xp, 0);
  return (
    <>
      {briefing && <p className="text-small text-on-parchment">{briefing}</p>}
      <ol className="flex flex-col">
        {steps.map(({ quest, done: isDone }, i) => (
          <li
            key={quest.id}
            className="relative flex min-h-14 items-center gap-3 border-b border-parchment-divider py-1.5 last:border-b-0"
          >
            <span
              aria-hidden
              className="w-5 shrink-0 font-pixel text-pixel text-on-parchment-muted"
            >
              {i + 1}
            </span>
            <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5", isDone && "opacity-60")}>
              <Link
                href={`/quests/${quest.id}`}
                className={cn(
                  "truncate text-title after:absolute after:inset-0 hover:underline focus-visible:underline",
                  isDone && "line-through",
                )}
              >
                {quest.title}
              </Link>
              <span className="font-pixel text-pixel text-on-parchment-muted">
                {stepMeta(quest, today)}
                {isDone && " · 완료"}
              </span>
            </div>
            <div className="relative z-10">
              <QuestAction quest={quest} doneToday={isDone} />
            </div>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-pixel text-pixel text-on-parchment" aria-live="polite">
          {done}/{steps.length} 완료 · 남은 보상 {formatXpGain(remainingXp)}
        </p>
        <form action={startAdventure}>
          <AdventureSubmit>다시 추천받기</AdventureSubmit>
        </form>
      </div>
    </>
  );
}

function Done({
  steps,
  character,
  canContinue,
}: {
  steps: AdventureStep[];
  character: { name: string; outfit: OutfitPreset };
  canContinue: boolean;
}) {
  const earned = steps.reduce((sum, s) => sum + s.quest.xp, 0);
  return (
    <div className="flex items-center gap-4">
      <CharacterSprite
        outfit={character.outfit}
        state="celebrating"
        scale={3}
        label={`${character.name}의 캐릭터가 기뻐하고 있어요`}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-title">오늘의 모험 완료!</p>
        <p className="font-pixel text-pixel text-on-parchment-muted">
          {steps.length}개 클리어 · {formatXpGain(earned)}
        </p>
        {canContinue && (
          <form action={startAdventure} className="mt-2">
            <AdventureSubmit>더 모험하기</AdventureSubmit>
          </form>
        )}
      </div>
    </div>
  );
}
