import type { Metadata } from "next";
import { Suspense } from "react";

import { AchievementBadge } from "@/components/game/AchievementBadge";
import { CharacterSprite } from "@/components/game/character/CharacterSprite";
import { LevelBadge } from "@/components/game/LevelBadge";
import { StatBar } from "@/components/game/StatBar";
import { XpBar } from "@/components/game/XpBar";
import { SettingsLink } from "@/components/layout/SettingsLink";
import { PixelFrame } from "@/components/pixel/PixelFrame";
import { SectionHeader } from "@/features/adventure/components/SectionHeader";
import { playerToday, requireCharacter } from "@/features/player/queries";
import { CharacterSkeleton } from "@/features/progress/components/CharacterSkeleton";
import { RecentXpList } from "@/features/progress/components/RecentXpList";
import { XpWeekChart } from "@/features/progress/components/XpWeekChart";
import {
  getProgress,
  getUnlockedAchievements,
  listRecentXp,
  xpByDay,
} from "@/features/progress/queries";
import { ACHIEVEMENTS, STATS, gameDate, isAchieved, levelFromXp, titleForLevel } from "@/lib/game";
import { formatGameDate, formatNumber } from "@/lib/utils/format";

export const metadata: Metadata = { title: "캐릭터" };

async function CharacterSheet() {
  const player = await requireCharacter();
  const today = playerToday(player);
  const { character, profile } = player;
  const [progress, unlocked, recent, week] = await Promise.all([
    getProgress({ ...player, totalXp: character.totalXp }),
    getUnlockedAchievements(),
    listRecentXp(8),
    xpByDay(today, 7),
  ]);
  const level = levelFromXp(character.totalXp);
  const { snapshot } = progress;
  // Recorded badges stay forever; anything the current progress already meets shows too
  // (e.g. reached by a questline bonus before the badge row was written).
  const earned = new Set([
    ...unlocked.keys(),
    ...ACHIEVEMENTS.filter((a) => isAchieved(a.criteria, snapshot)).map((a) => a.id),
  ]);
  const unlockedOn = (id: string) => {
    const at = unlocked.get(id);
    if (at) return formatGameDate(gameDate(new Date(at), profile.timezone, profile.dayStartHour));
    return earned.has(id) ? "달성" : undefined;
  };

  return (
    <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-12">
      <div className="flex flex-col gap-10">
        <PixelFrame variant="raised" className="flex flex-col items-center gap-4 px-5 pt-6 pb-5">
          <div className="flex w-full justify-end">
            <SettingsLink />
          </div>
          <span className="pixel-bob">
            <CharacterSprite
              outfit={character.outfit}
              scale={5}
              label={`${character.name}의 캐릭터`}
            />
          </span>
          <div className="flex flex-col items-center gap-1 text-center">
            <h2 className="text-h2">{character.name}</h2>
            <p className="text-small text-text-muted">{titleForLevel(level).ko}</p>
            <LevelBadge level={level} />
          </div>
          <XpBar totalXp={character.totalXp} className="w-full" />
        </PixelFrame>

        <section aria-labelledby="stats-title" className="flex flex-col gap-4">
          <SectionHeader id="stats-title" label="STATS" tone="muted" />
          <div className="flex flex-col gap-3">
            {STATS.map((stat) => (
              <StatBar key={stat} stat={stat} xp={player.statXp[stat]} />
            ))}
          </div>
          <p className="text-caption text-text-muted">
            스탯은 평가가 아니라 성장 기록이에요. 퀘스트를 끝낼 때마다 그 분야가 조금씩 자라요.
          </p>
        </section>

        <section aria-labelledby="record-title" className="flex flex-col gap-4">
          <SectionHeader id="record-title" label="RECORD" tone="muted" />
          <dl className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "연속 모험", value: `${snapshot.adventureStreak}일` },
              { label: "완료한 퀘스트", value: formatNumber(snapshot.completions) },
              { label: "클리어한 퀘스트라인", value: formatNumber(snapshot.goalsCleared) },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col-reverse gap-1 rounded-sm border border-border px-2 py-3"
              >
                <dt className="text-caption text-text-muted">{item.label}</dt>
                <dd className="font-pixel text-pixel-2x">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <div className="flex flex-col gap-10">
        <section aria-labelledby="week-title" className="flex flex-col gap-4">
          <SectionHeader id="week-title" label="THIS WEEK" tone="muted" />
          <XpWeekChart days={week} today={today} />
        </section>

        <section aria-labelledby="badges-title" className="flex flex-col gap-4">
          <SectionHeader
            id="badges-title"
            label="ACHIEVEMENTS"
            tone="muted"
            meta={`${earned.size}/${ACHIEVEMENTS.length}`}
          />
          <ul className="grid gap-5 sm:grid-cols-2">
            {[...ACHIEVEMENTS]
              .sort((a, b) => Number(earned.has(b.id)) - Number(earned.has(a.id)))
              .map((a) => (
                <li key={a.id}>
                  <AchievementBadge
                    name={a.name}
                    description={a.description}
                    rarity={a.rarity}
                    icon={a.icon}
                    unlockedOn={unlockedOn(a.id)}
                  />
                </li>
              ))}
          </ul>
        </section>

        <section aria-labelledby="log-title" className="flex flex-col gap-2">
          <SectionHeader id="log-title" label="XP LOG" tone="muted" />
          {recent.length ? (
            <RecentXpList logs={recent} />
          ) : (
            <p className="text-small text-text-muted">
              아직 기록이 없어요. 첫 퀘스트를 끝내면 여기에 남아요.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

export default function CharacterPage() {
  return (
    <>
      <h1 className="sr-only">캐릭터</h1>
      <Suspense fallback={<CharacterSkeleton />}>
        <CharacterSheet />
      </Suspense>
    </>
  );
}
