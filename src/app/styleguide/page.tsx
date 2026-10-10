import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AchievementBadge } from "@/components/game/AchievementBadge";
import { BattleScene } from "@/components/game/BattleScene";
import { BossBanner } from "@/components/game/BossBanner";
import { MonsterSprite } from "@/components/game/monster/MonsterSprite";
import { BOSS_MONSTER, MONSTER_BY_STAT } from "@/components/game/monster/monster";
import { QuestTypeTag } from "@/components/game/QuestTypeTag";
import { StatBar } from "@/components/game/StatBar";
import { ICON_ATLAS } from "@/components/pixel/icons.generated";
import { PixelBar } from "@/components/pixel/PixelBar";
import { PixelFrame } from "@/components/pixel/PixelFrame";
import { PixelGlyph, PixelIcon } from "@/components/pixel/PixelIcon";
import { PixelSpinner } from "@/components/pixel/PixelSpinner";
import { PixelStars } from "@/components/pixel/PixelStars";
import { PixelTag } from "@/components/pixel/PixelTag";
import { ToastProvider } from "@/components/ui/Toast";
import { ACHIEVEMENTS, DIFFICULTIES, QUEST_TYPES, STATS, addDays } from "@/lib/game";
import { XpWeekChart } from "@/features/progress/components/XpWeekChart";

import { ButtonDemo, CharacterDemo, FormDemo, QuestDemo } from "./_components/Demos";
import { Section, Specimen } from "./_components/Section";
import { QuestAndStatSwatches, RampSwatches, SemanticSwatches } from "./_components/Swatches";

export const metadata: Metadata = { title: "Styleguide", robots: { index: false } };

/** Dev/preview only. Enable on a deployed preview with ENABLE_STYLEGUIDE=1. */
const ENABLED = process.env.NODE_ENV !== "production" || process.env.ENABLE_STYLEGUIDE === "1";

const DEMO_TODAY = "2026-10-08";

const DEMO_STAT_XP = { int: 2100, foc: 2600, vit: 950, soc: 320, cre: 600 } as const;

const NAV = [
  ["color", "Color"],
  ["type", "Type"],
  ["art", "Pixel Art"],
  ["pixel", "Pixel UI"],
  ["modern", "Modern UI"],
  ["game", "Game"],
] as const;

export default function StyleguidePage() {
  if (!ENABLED) notFound();

  return (
    <ToastProvider>
      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3">
          <p className="font-pixel text-pixel text-accent">LIFE RPG · DESIGN SYSTEM</p>
          <h1 className="font-pixel text-pixel-3x">STYLEGUIDE</h1>
          <p className="max-w-prose text-body text-text-secondary">
            토큰, 픽셀 아트, 컴포넌트의 살아 있는 레퍼런스. 새 컴포넌트와 에셋은 이 페이지에 먼저
            추가합니다.
          </p>
          <nav aria-label="섹션" className="flex flex-wrap gap-x-4 gap-y-1">
            {NAV.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="text-small text-primary-text hover:underline">
                {label}
              </a>
            ))}
          </nav>
        </header>

        <Section
          id="color"
          title="Color"
          note="design/COLOR_PALETTE.md — 컴포넌트는 시맨틱 토큰만 사용"
        >
          <Specimen label="Semantic tokens">
            <SemanticSwatches />
          </Specimen>
          <Specimen label="Quest types · Stats">
            <QuestAndStatSwatches />
          </Specimen>
          <Specimen label="Ramps (픽셀 프리미티브 내부 전용)">
            <div className="w-full">
              <RampSwatches />
            </div>
          </Specimen>
        </Section>

        <Section
          id="type"
          title="Typography"
          note="Galmuri11은 12px 설계 → 12 / 24 / 36px에서만 선명 (실측 AA 0%)"
        >
          <Specimen label="Pixel 36 · 24 · 12 (Galmuri11)">
            <div className="flex flex-col gap-2">
              <span className="font-pixel text-pixel-3x">LEVEL UP!</span>
              <span className="font-pixel text-pixel-2x text-xp-text">Lv.24 · 메인 퀘스트</span>
              <span className="font-pixel text-pixel">MAIN QUEST · +70 XP · 1,000</span>
            </div>
          </Specimen>
          <Specimen label="Sans — H1 24 / H2 18 / Title 16 / Body 16 / Small 14 / Caption 12 (Pretendard)">
            <div className="flex flex-col gap-1">
              <span className="text-h1">오늘의 모험</span>
              <span className="text-h2">메인 퀘스트</span>
              <span className="text-title">나만의 웹서비스 출시하기</span>
              <span className="text-body">
                현실의 일정과 목표를 퀘스트로 바꾸고, 행동할 때마다 캐릭터가 성장합니다.
              </span>
              <span className="text-small text-text-muted">D-3 · 예상 2시간</span>
              <span className="text-caption text-text-muted">마지막 업데이트 2시간 전</span>
            </div>
          </Specimen>
        </Section>

        <Section
          id="art"
          title="Pixel Art"
          note="LIFE-32 팔레트 · 정수 배율 · 1ap 외곽선 · 좌상단 광원"
        >
          <CharacterDemo />
          <Specimen label={`Icons 16×16 @2× (${ICON_ATLAS.names.length})`}>
            <ul className="grid w-full grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-7">
              {ICON_ATLAS.names.map((name) => (
                <li key={name} className="flex flex-col items-center gap-1">
                  <PixelIcon name={name} label={name} />
                  <span className="text-caption text-text-muted">{name}</span>
                </li>
              ))}
            </ul>
          </Specimen>
          <Specimen label="Icons @3× · @4× · Glyphs 8×8 @2×">
            <PixelIcon name="quest-boss" scale={3} label="boss 3x" />
            <PixelIcon name="quest-boss" scale={4} label="boss 4x" />
            <PixelGlyph name="star" label="star" />
            <PixelGlyph name="star-empty" label="empty star" />
          </Specimen>
        </Section>

        <Section
          id="pixel"
          title="Pixel UI"
          note="design/PIXEL_RULES.md §6 — 2px 유닛, notched corner, 블러 없는 하드 섀도"
        >
          <Specimen label="PixelFrame — surface · raised · parchment · wood · quest stripes">
            <div className="grid w-full gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <PixelFrame className="p-4">surface</PixelFrame>
              <PixelFrame variant="raised" className="p-4">
                raised
              </PixelFrame>
              <PixelFrame variant="parchment" className="p-4">
                parchment — 두루마리
              </PixelFrame>
              <PixelFrame variant="wood" className="p-4">
                wood — 게시판
              </PixelFrame>
              {QUEST_TYPES.map((type) => (
                <PixelFrame key={type} stripe={type} className="py-3 pr-3">
                  <QuestTypeTag type={type} />
                </PixelFrame>
              ))}
            </div>
          </Specimen>
          <ButtonDemo />
          <Specimen label="PixelBar — XP · stats · success · boss (fill snaps to 2px units)">
            <div className="grid w-full max-w-md gap-3">
              <PixelBar ratio={0.42} label="경험치 예시" />
              {STATS.map((stat, i) => (
                <PixelBar
                  key={stat}
                  ratio={0.2 + i * 0.15}
                  tone={stat}
                  units={4}
                  label={`${stat} 예시`}
                />
              ))}
              <PixelBar ratio={0.75} tone="success" units={4} label="완료율 예시" />
              <PixelBar ratio={0.4} tone="boss" units={4} label="보스 준비도 예시" />
            </div>
          </Specimen>
          <Specimen label="Tags · Difficulty · Spinner · Skeleton">
            {QUEST_TYPES.map((type) => (
              <QuestTypeTag key={type} type={type} />
            ))}
            <PixelTag tone="xp">+300 XP</PixelTag>
            {DIFFICULTIES.map((d) => (
              <PixelStars key={d} value={d} />
            ))}
            <PixelSpinner className="text-accent" />
            <span className="pixel-skeleton block h-6 w-32" aria-hidden />
          </Specimen>
        </Section>

        <Section
          id="modern"
          title="Modern UI"
          note="본문·폼·설정은 현대적 UX — radius 4px, 같은 토큰"
        >
          <FormDemo />
        </Section>

        <Section
          id="game"
          title="Game Components"
          note="QuestCard · QuestRow · StatBar — 완료 버튼을 눌러 보세요 (되돌리기 토스트)"
        >
          <QuestDemo />
          <Specimen label="StatBar — 성장 기록 (평가 아님)">
            <div className="grid w-full max-w-md gap-3">
              {STATS.map((stat) => (
                <StatBar key={stat} stat={stat} xp={DEMO_STAT_XP[stat]} />
              ))}
            </div>
          </Specimen>
          <Specimen label="Monsters 24×24 · boss 32×32 @2× — 스탯별 적, 대기(2프레임) / 처치(잉크 램프)">
            <div className="flex flex-wrap items-end gap-6">
              {[...STATS.map((stat) => MONSTER_BY_STAT[stat]), BOSS_MONSTER].map((m) => (
                <figure key={m.name} className="flex flex-col items-center gap-2">
                  <span className="flex items-end gap-2">
                    <MonsterSprite name={m.name} />
                    <MonsterSprite name={m.name} state="defeated" />
                  </span>
                  <figcaption className="font-pixel text-pixel text-text-muted">
                    {m.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          </Specimen>
          <Specimen label="BattleScene — 퀘스트 상세의 전투: 캐릭터 vs 적, HP, 전투 메시지 (완료하면 처치 연출)">
            <div className="grid w-full gap-6 lg:grid-cols-2">
              <BattleScene
                hero={{ name: "모험가", outfit: "royal", level: 3 }}
                monster={MONSTER_BY_STAT.int}
                level={3}
                xp={70}
                defeated={false}
                hp={1}
              />
              <BattleScene
                hero={{ name: "모험가", outfit: "ember", level: 3 }}
                monster={BOSS_MONSTER}
                level={5}
                xp={500}
                defeated={false}
                hp={0.6}
              />
            </div>
          </Specimen>
          <Specimen label="BossBanner — 현상수배서 + 드래곤, 퀘스트라인 보스는 HP 바 (준비할수록 감소)">
            <div className="flex w-full max-w-xl flex-col gap-6">
              <BossBanner
                title="자료구조 중간고사"
                deadline={addDays(DEMO_TODAY, 3)}
                today={DEMO_TODAY}
                xp={500}
                href="#game"
                readiness={0.4}
              />
              <BossBanner
                title="컴퓨터네트워크 과제 제출"
                deadline={addDays(DEMO_TODAY, 1)}
                today={DEMO_TODAY}
                xp={300}
                href="#game"
              />
            </div>
          </Specimen>
          <Specimen label="AchievementBadge — 희귀도는 베벨 색, 잠김은 실루엣 + 텍스트">
            <div className="grid w-full max-w-2xl gap-5 sm:grid-cols-2">
              {(["first_step", "boss_slayer_1", "quests_100", "adventure_streak_30"] as const).map(
                (id, i) => {
                  const a = ACHIEVEMENTS.find((x) => x.id === id)!;
                  return (
                    <AchievementBadge
                      key={id}
                      name={a.name}
                      description={a.description}
                      rarity={a.rarity}
                      icon={a.icon}
                      unlockedOn={i < 3 ? "10월 8일" : undefined}
                    />
                  );
                },
              )}
            </div>
          </Specimen>
          <Specimen label="XpWeekChart — 정수 유닛 막대, 목표선·빨간 날 없음">
            <div className="w-full max-w-md">
              <XpWeekChart
                today={DEMO_TODAY}
                days={[60, 180, 0, 130, 180, 60, 20].map((xp, i) => ({
                  date: addDays(DEMO_TODAY, i - 6),
                  xp,
                }))}
              />
            </div>
          </Specimen>
        </Section>
      </main>
    </ToastProvider>
  );
}
