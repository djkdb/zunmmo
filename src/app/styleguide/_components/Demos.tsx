"use client";

import { useState } from "react";

import {
  CHARACTER_STATES,
  CharacterSprite,
  OUTFIT_PRESETS,
  type OutfitPreset,
  resolveCharacterState,
} from "@/components/game/character/CharacterSprite";
import { CompleteButton } from "@/components/game/CompleteButton";
import { LevelBadge } from "@/components/game/LevelBadge";
import { QuestCard, type QuestCardData } from "@/components/game/QuestCard";
import { QuestRow } from "@/components/game/QuestRow";
import { XpBar } from "@/components/game/XpBar";
import { PixelButton } from "@/components/pixel/PixelButton";
import { PixelFrame } from "@/components/pixel/PixelFrame";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import {
  type Difficulty,
  type QuestType,
  detectLevelUp,
  levelFromXp,
  questXp,
  titleForLevel,
} from "@/lib/game";
import { formatXpGain } from "@/lib/utils/format";

/** Fixed demo date so the page prerenders deterministically. */
export const DEMO_TODAY = "2026-10-08";

function demoQuest(
  title: string,
  type: QuestType,
  difficulty: Difficulty,
  extra: Partial<QuestCardData> = {},
): QuestCardData {
  return { title, type, difficulty, xp: questXp(type, difficulty), ...extra };
}

const DEMO_QUESTS: QuestCardData[] = [
  demoQuest("컴퓨터네트워크 과제 제출", "boss", 4, {
    deadline: "2026-10-09",
    estimatedMinutes: 180,
  }),
  demoQuest("로그인 기능 만들기", "main", 3, { estimatedMinutes: 120 }),
  demoQuest("AI 강의 3강 복습하기", "daily", 3, { estimatedMinutes: 60 }),
  demoQuest("토요일 축구하기", "side", 2, { deadline: "2026-10-10" }),
];

const DAILY_ROWS = [demoQuest("운동 30분", "daily", 2), demoQuest("영단어 30개", "daily", 1)];

/** Character header + XP gain loop: the core "+XP, the character grew" feedback in miniature. */
export function CharacterDemo() {
  const [outfit, setOutfit] = useState<OutfitPreset>("royal");
  const [totalXp, setTotalXp] = useState(23_420);
  const [message, setMessage] = useState("");
  const [replay, setReplay] = useState(0);
  const level = levelFromXp(totalXp);

  function gain(xp: number) {
    const next = totalXp + xp;
    const levelUp = detectLevelUp(totalXp, next);
    setTotalXp(next);
    setMessage(
      levelUp ? `${formatXpGain(xp)} · LEVEL UP! Lv.${levelUp.to}` : `${formatXpGain(xp)} 획득`,
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        {/* 3× on mobile, 4× from lg (PIXEL_RULES §1.2) */}
        <span className="lg:hidden">
          <CharacterSprite outfit={outfit} scale={3} label="성준의 캐릭터" />
        </span>
        <span className="hidden lg:block">
          <CharacterSprite outfit={outfit} scale={4} label="성준의 캐릭터" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-title">성준</span>
          <span className="text-small text-text-muted">{titleForLevel(level).ko}</span>
          <LevelBadge level={level} />
          <XpBar totalXp={totalXp} />
        </div>
      </div>
      <p aria-live="polite" className="min-h-4 font-pixel text-pixel text-xp-text">
        {message}
      </p>
      <div className="flex flex-wrap gap-4">
        <PixelButton onClick={() => gain(70)}>+70 XP</PixelButton>
        <PixelButton onClick={() => gain(500)} variant="primary">
          +500 XP (BOSS)
        </PixelButton>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-small text-text-muted">
          상태 (CHARACTER_GUIDE §5) — 1회 재생 상태는 누르면 다시 재생, 끝나면 idle로 돌아가요
        </p>
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {CHARACTER_STATES.map((state) => (
            <li key={state}>
              <button
                type="button"
                onClick={() => setReplay((n) => n + 1)}
                className="flex w-full flex-col items-center gap-1 rounded-sm p-1 hover:bg-surface-raised"
              >
                <CharacterSprite
                  key={`${state}-${replay}`}
                  outfit={outfit}
                  state={state}
                  scale={2}
                  label={`${state} 상태`}
                  shadow={false}
                />
                <span className="font-pixel text-pixel text-text-muted">{state}</span>
                {resolveCharacterState(state) !== state && (
                  <span className="text-caption text-text-muted">
                    → {resolveCharacterState(state)}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <fieldset className="flex flex-wrap gap-4">
        <legend className="mb-2 text-small text-text-muted">외형 프리셋 (palette swap)</legend>
        {OUTFIT_PRESETS.map((preset) => (
          <label key={preset} className="flex cursor-pointer flex-col items-center gap-1">
            <input
              type="radio"
              name="outfit"
              value={preset}
              checked={outfit === preset}
              onChange={() => setOutfit(preset)}
              className="peer sr-only"
            />
            <PixelFrame flat selected={outfit === preset} className="p-1">
              <CharacterSprite outfit={preset} scale={2} label={`${preset} 외형`} shadow={false} />
            </PixelFrame>
            <span className="text-caption text-text-muted">{preset}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}

export function QuestDemo() {
  const toast = useToast();
  const [done, setDone] = useState<Record<string, boolean>>({});

  function toggle(title: string, xp: number) {
    const completed = !done[title];
    setDone((d) => ({ ...d, [title]: completed }));
    if (completed) {
      toast({
        message: `${formatXpGain(xp)} · ${title}`,
        tone: "success",
        action: { label: "되돌리기", onClick: () => setDone((d) => ({ ...d, [title]: false })) },
      });
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-5 lg:grid-cols-2">
        {DEMO_QUESTS.map((quest) => (
          <QuestCard
            key={quest.title}
            quest={{ ...quest, completed: done[quest.title] }}
            today={DEMO_TODAY}
            action={
              <CompleteButton
                questTitle={quest.title}
                completed={Boolean(done[quest.title])}
                onToggle={() => toggle(quest.title, quest.xp)}
              />
            }
          />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="font-pixel text-pixel text-quest-daily-text">DAILY</h3>
        <ul>
          {DAILY_ROWS.map((quest) => (
            <QuestRow
              key={quest.title}
              title={quest.title}
              difficulty={quest.difficulty}
              xp={quest.xp}
              completed={done[quest.title]}
              action={
                <CompleteButton
                  questTitle={quest.title}
                  completed={Boolean(done[quest.title])}
                  onToggle={() => toggle(quest.title, quest.xp)}
                />
              }
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ButtonDemo() {
  const [loading, setLoading] = useState(false);
  return (
    <div className="flex flex-col gap-6">
      <PixelButton
        variant="accent"
        size="lg"
        block
        icon={<PixelIcon name="ui-sword" />}
        className="max-w-md"
      >
        START TODAY&apos;S ADVENTURE
      </PixelButton>
      <div className="flex flex-wrap items-center gap-5">
        <PixelButton>DEFAULT</PixelButton>
        <PixelButton variant="primary" icon={<PixelIcon name="ui-plus" />}>
          퀘스트 추가
        </PixelButton>
        <PixelButton disabled>DISABLED</PixelButton>
        <PixelButton
          loading={loading}
          onClick={() => {
            setLoading(true);
            window.setTimeout(() => setLoading(false), 1500);
          }}
        >
          LOADING
        </PixelButton>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button>보조 버튼</Button>
        <Button variant="ghost">고스트</Button>
        <Button variant="link">텍스트 링크</Button>
        <Button variant="danger">퀘스트 보관</Button>
        <Button disabled>비활성</Button>
      </div>
    </div>
  );
}

export function FormDemo() {
  const [dialog, setDialog] = useState(false);
  const [sheet, setSheet] = useState(false);
  return (
    <div className="flex flex-col gap-6">
      <div className="grid max-w-md gap-4">
        <TextField
          label="퀘스트 이름"
          placeholder="예: AI 강의 3강 복습하기"
          hint="동사로 끝나면 더 잘 보여요."
        />
        <TextField
          label="예상 시간 (분)"
          inputMode="numeric"
          defaultValue="0"
          error="5분 이상으로 입력해 주세요."
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setDialog(true)}>Dialog 열기</Button>
        <Button onClick={() => setSheet(true)}>Sheet 열기</Button>
      </div>
      <Dialog
        open={dialog}
        onClose={() => setDialog(false)}
        title="퀘스트를 보관할까요?"
        description="보관한 퀘스트는 목록에서 숨겨지고, 획득한 XP 기록은 그대로 남아요."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialog(false)}>
              취소
            </Button>
            <Button variant="danger" onClick={() => setDialog(false)}>
              보관하기
            </Button>
          </>
        }
      />
      <Dialog open={sheet} onClose={() => setSheet(false)} title="새 퀘스트" variant="sheet">
        <TextField label="퀘스트 이름" placeholder="오늘 해야 할 일을 적어 보세요" />
      </Dialog>
    </div>
  );
}
