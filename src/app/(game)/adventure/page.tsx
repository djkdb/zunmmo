import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { BossBanner } from "@/components/game/BossBanner";
import { CharacterHeader } from "@/components/game/CharacterHeader";
import type { CharacterState } from "@/components/game/character/CharacterSprite";
import { EmptyState } from "@/components/game/EmptyState";
import { QuestCard } from "@/components/game/QuestCard";
import { QuestRow } from "@/components/game/QuestRow";
import { QuestlineMap } from "@/components/game/QuestlineMap";
import { SettingsLink } from "@/components/layout/SettingsLink";
import { PixelFrame } from "@/components/pixel/PixelFrame";
import { selectBoard } from "@/features/adventure/board";
import { AdventureSkeleton } from "@/features/adventure/components/AdventureSkeleton";
import { type AdventureStep, TodayAdventure } from "@/features/adventure/components/TodayAdventure";
import { getAdventure } from "@/features/adventure/queries";
import {
  briefingFor,
  completionWindowStart,
  recommendationFor,
} from "@/features/adventure/recommendation";
import { SectionHeader } from "@/features/adventure/components/SectionHeader";
import { type PlayerWithCharacter, playerToday, requireCharacter } from "@/features/player/queries";
import type { GameDate } from "@/lib/game";
import { RecentXpList } from "@/features/progress/components/RecentXpList";
import {
  type CompletionLog,
  listCompletionsSince,
  listRecentXp,
} from "@/features/progress/queries";
import { QuestAction } from "@/features/quests/components/QuestAction";
import {
  type QuestView,
  type QuestlineView,
  listQuestlines,
  listQuests,
} from "@/features/quests/queries";
import { toCardData } from "@/features/quests/view";

export const metadata: Metadata = { title: "모험" };

const questHref = (id: string) => `/quests/${id}`;

async function Adventure() {
  const player = await requireCharacter();
  const today = playerToday(player);
  const [quests, questlines, completions, recent] = await Promise.all([
    listQuests(today),
    listQuestlines(today),
    listCompletionsSince(completionWindowStart(today)),
    listRecentXp(3),
  ]);
  const board = selectBoard(quests, questlines, today, completions);
  const { panel, mood } = await todayPanel(player, today, { quests, questlines, completions });
  const { character } = player;

  return (
    <div className="flex flex-col gap-10">
      <CharacterHeader
        name={character.name}
        outfit={character.outfit}
        totalXp={character.totalXp}
        state={board.isEmpty ? "idle" : mood}
        action={<SettingsLink />}
      />

      {!board.isEmpty && <TodayAdventure {...panel} />}

      {board.isEmpty ? (
        <PixelFrame variant="parchment">
          <EmptyState
            icon="ui-quests"
            surface="parchment"
            message="퀘스트 게시판이 비어 있어. 첫 퀘스트를 올려 볼까?"
            action={
              <Link
                href="/quests/new"
                className="pixel-btn inline-flex min-h-11 items-center px-5 font-pixel text-pixel uppercase"
                data-variant="accent"
              >
                퀘스트 추가
              </Link>
            }
          />
        </PixelFrame>
      ) : (
        <>
          {board.boss?.deadline && (
            <BossBanner
              title={board.boss.title}
              deadline={board.boss.deadline}
              today={today}
              xp={board.boss.xp}
              href={questHref(board.boss.id)}
            />
          )}

          <section aria-labelledby="main-title" className="flex flex-col gap-4">
            <SectionHeader
              id="main-title"
              label="MAIN QUEST"
              tone="main"
              href="/quests?type=main"
            />
            {board.questlines.length ? (
              <div className="flex flex-col gap-6">
                {board.questlines.map((line) => (
                  <QuestlineMap
                    key={line.id}
                    title={line.title}
                    ratio={line.progress.ratio}
                    questHref={questHref}
                    steps={line.steps.map((s) => ({
                      id: s.id,
                      title: s.title,
                      type: s.type,
                      xp: s.xp,
                      done: s.status === "completed",
                    }))}
                  />
                ))}
              </div>
            ) : (
              <p className="text-small text-text-muted">
                오래 붙잡고 갈 목표가 있다면{" "}
                <Link href="/quests/new?type=main" className="text-primary-text hover:underline">
                  메인 퀘스트라인
                </Link>
                을 시작해 봐.
              </p>
            )}
          </section>

          <section aria-labelledby="daily-title" className="flex flex-col gap-2">
            <SectionHeader
              id="daily-title"
              label="DAILY"
              tone="daily"
              meta={
                board.dailies.length
                  ? `${board.dailies.filter((d) => d.doneToday).length}/${board.dailies.length}`
                  : undefined
              }
              href="/quests?type=daily"
            />
            {board.dailies.length ? (
              <ul>
                {board.dailies.map(({ quest, doneToday }) => (
                  <QuestRow
                    key={quest.id}
                    title={quest.title}
                    difficulty={quest.difficulty}
                    xp={quest.xp}
                    completed={doneToday}
                    href={questHref(quest.id)}
                    action={<QuestAction quest={quest} doneToday={doneToday} />}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-small text-text-muted">
                오늘 할 데일리가 없어.{" "}
                <Link href="/quests/new?type=daily" className="text-primary-text hover:underline">
                  습관 하나 만들기
                </Link>
              </p>
            )}
          </section>

          {board.sides.length > 0 && (
            <section aria-labelledby="side-title" className="flex flex-col gap-4">
              <SectionHeader id="side-title" label="SIDE" tone="side" href="/quests?type=side" />
              <ul className="flex flex-col gap-5">
                {board.sides.map((q) => (
                  <li key={q.id}>
                    <QuestCard
                      quest={toCardData(q)}
                      today={today}
                      href={questHref(q.id)}
                      action={<QuestAction quest={q} doneToday={false} />}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {recent.length > 0 && (
            <section aria-labelledby="recent-title" className="flex flex-col gap-2">
              <SectionHeader
                id="recent-title"
                label="RECENT"
                tone="muted"
                href="/character"
                linkLabel="성장 기록"
              />
              <RecentXpList logs={recent} />
            </section>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Pick the Today's Adventure state (fixed picks once started, otherwise a fresh
 * recommendation with the GM's line) and how the character should look about it.
 */
async function todayPanel(
  player: PlayerWithCharacter,
  today: GameDate,
  loaded: { quests: QuestView[]; questlines: QuestlineView[]; completions: CompletionLog[] },
): Promise<{ panel: Parameters<typeof TodayAdventure>[0]; mood: CharacterState }> {
  const adventure = await getAdventure(today);
  const doneToday = new Set(
    loaded.completions.filter((c) => c.occurrenceDate === today).map((c) => c.questId),
  );
  const byId = new Map(loaded.quests.map((q) => [q.id, q]));
  const steps: AdventureStep[] = (adventure?.questIds ?? []).flatMap((id) => {
    const quest = byId.get(id);
    if (!quest || quest.status === "archived") return [];
    return [{ quest, done: doneToday.has(id) || quest.status === "completed" }];
  });

  if (steps.length && steps.some((s) => !s.done)) {
    return {
      panel: { state: "active", steps, briefing: adventure?.briefing ?? null, today },
      mood: "walking",
    };
  }
  const recommendation = await recommendationFor(player, today, loaded);
  if (steps.length) {
    return {
      panel: {
        state: "done",
        steps,
        character: { name: player.character.name, outfit: player.character.outfit },
        canContinue: recommendation.picks.length > 0,
      },
      mood: "celebrating",
    };
  }
  const gm = await briefingFor(player, today, loaded, recommendation);
  if (!recommendation.picks.length) return { panel: { state: "rest" }, mood: gm.mood };
  return {
    panel: {
      state: "ready",
      briefing: gm.line,
      titles: recommendation.picks.map((p) => byId.get(p.questId)?.title ?? ""),
      totalXp: recommendation.totalXp,
      totalMinutes: recommendation.totalMinutes,
    },
    mood: gm.mood,
  };
}

export default function AdventurePage() {
  return (
    <>
      <h1 className="sr-only">오늘의 모험</h1>
      <Suspense fallback={<AdventureSkeleton />}>
        <Adventure />
      </Suspense>
    </>
  );
}
