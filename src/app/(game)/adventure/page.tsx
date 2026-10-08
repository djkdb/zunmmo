import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { BossBanner } from "@/components/game/BossBanner";
import { CharacterHeader } from "@/components/game/CharacterHeader";
import { EmptyState } from "@/components/game/EmptyState";
import { QuestCard } from "@/components/game/QuestCard";
import { QuestRow } from "@/components/game/QuestRow";
import { QuestlineMap } from "@/components/game/QuestlineMap";
import { SettingsLink } from "@/components/layout/SettingsLink";
import { PixelFrame } from "@/components/pixel/PixelFrame";
import { selectBoard } from "@/features/adventure/board";
import { AdventureSkeleton } from "@/features/adventure/components/AdventureSkeleton";
import { SectionHeader } from "@/features/adventure/components/SectionHeader";
import { playerToday, requireCharacter } from "@/features/player/queries";
import { RecentXpList } from "@/features/progress/components/RecentXpList";
import { listCompletionsSince, listRecentXp } from "@/features/progress/queries";
import { QuestAction } from "@/features/quests/components/QuestAction";
import { listQuestlines, listQuests } from "@/features/quests/queries";
import { toCardData } from "@/features/quests/view";
import { isoWeekStart } from "@/lib/game";

export const metadata: Metadata = { title: "모험" };

const questHref = (id: string) => `/quests/${id}`;

async function Adventure() {
  const player = await requireCharacter();
  const today = playerToday(player);
  const [quests, questlines, completions, recent] = await Promise.all([
    listQuests(today),
    listQuestlines(today),
    listCompletionsSince(isoWeekStart(today)),
    listRecentXp(3),
  ]);
  const board = selectBoard(quests, questlines, today, completions);
  const { character } = player;

  return (
    <div className="flex flex-col gap-10">
      <CharacterHeader
        name={character.name}
        outfit={character.outfit}
        totalXp={character.totalXp}
        action={<SettingsLink />}
      />

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
