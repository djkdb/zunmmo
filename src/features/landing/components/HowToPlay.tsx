import type { ReactNode } from "react";

import { LevelBadge } from "@/components/game/LevelBadge";
import { QuestCard } from "@/components/game/QuestCard";
import { QuestTypeTag } from "@/components/game/QuestTypeTag";
import { StatBar } from "@/components/game/StatBar";
import { XpBar } from "@/components/game/XpBar";
import { PixelFrame } from "@/components/pixel/PixelFrame";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { PixelStars } from "@/components/pixel/PixelStars";
import { questXp } from "@/lib/game";

/** Fixed sample date so the page prerenders deterministically. */
const SAMPLE_TODAY = "2026-10-08";

function Step({
  index,
  label,
  title,
  description,
  children,
}: {
  index: number;
  label: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <li className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="font-pixel text-pixel text-accent">
          STEP {index} · {label}
        </span>
        <h3 className="text-h2">{title}</h3>
        <p className="text-body text-text-secondary">{description}</p>
      </div>
      {children}
    </li>
  );
}

export function HowToPlay() {
  return (
    <section
      id="how-to-play"
      aria-labelledby="how-to-play-title"
      className="mx-auto flex w-full max-w-6xl scroll-mt-6 flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8"
    >
      <header className="flex flex-col gap-2">
        <p className="font-pixel text-pixel text-text-muted">HOW TO PLAY</p>
        <h2 id="how-to-play-title" className="text-h1">
          세 걸음이면 모험이 시작돼요
        </h2>
      </header>
      <ol className="grid gap-12 lg:grid-cols-3 lg:gap-8">
        <Step
          index={1}
          label="POST"
          title="퀘스트 게시판에 올리기"
          description="할 일을 적고 종류와 난이도만 고르세요. 자주 하는 일은 템플릿으로 한 번에."
        >
          <PixelFrame variant="parchment" className="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-3">
              <PixelIcon name="ui-plus" />
              <span className="text-title">컴퓨터네트워크 과제 제출</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-small text-parchment-900">
              <QuestTypeTag type="boss" />
              <PixelStars value={4} />
              <span>금요일까지</span>
            </div>
          </PixelFrame>
        </Step>
        <Step
          index={2}
          label="ADVENTURE"
          title="오늘의 모험 떠나기"
          description="마감·보스·습관을 따져 오늘 할 퀘스트를 골라 줘요. 버튼 하나로 하루가 시작돼요."
        >
          <div className="flex flex-col gap-5">
            <QuestCard
              today={SAMPLE_TODAY}
              quest={{
                title: "AI 중간고사",
                type: "boss",
                difficulty: 5,
                xp: questXp("boss", 5),
                deadline: "2026-10-12",
              }}
            />
            <QuestCard
              today={SAMPLE_TODAY}
              quest={{
                title: "AI 강의 1강 복습하기",
                type: "daily",
                difficulty: 2,
                xp: questXp("daily", 2),
                estimatedMinutes: 40,
              }}
            />
          </div>
        </Step>
        <Step
          index={3}
          label="LEVEL UP"
          title="완료하고 성장하기"
          description="퀘스트를 끝낼 때마다 XP가 쌓이고 레벨이 올라요. 스탯은 평가가 아니라 내가 쌓아 온 기록이에요."
        >
          <PixelFrame className="flex flex-col gap-4 p-4">
            <div className="flex items-end justify-between">
              <LevelBadge level={12} />
              <span className="font-pixel text-pixel text-xp-text">+500 XP</span>
            </div>
            <XpBar totalXp={11_640} />
            <div className="flex flex-col gap-2">
              <StatBar stat="int" xp={1400} />
              <StatBar stat="vit" xp={700} />
              <StatBar stat="cre" xp={420} />
            </div>
          </PixelFrame>
        </Step>
      </ol>
    </section>
  );
}
