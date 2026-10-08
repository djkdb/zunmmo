"use client";

import { type ReactNode, createContext, useCallback, useContext, useMemo, useState } from "react";

import { RARITY_META } from "@/components/game/AchievementBadge";
import { CharacterSprite } from "@/components/game/character/CharacterSprite";
import { LevelBadge } from "@/components/game/LevelBadge";
import { PixelButton } from "@/components/pixel/PixelButton";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { titleForLevel } from "@/lib/game";
import { formatXpGain } from "@/lib/utils/format";

import type { CompletionOutcome } from "../types";

interface GameEffects {
  /** Play the reward beats of a completion: announcement, questline clear, badges, level-up. */
  celebrate: (outcome: CompletionOutcome) => void;
  /** Screen-reader-only announcement (UI_GUIDE §10). */
  announce: (message: string) => void;
}

const GameEffectsContext = createContext<GameEffects | null>(null);

/**
 * Reward moments live in one place so every completion surface (dashboard, list, detail)
 * feels the same. Order: XP (already floated by the button) → questline clear → badges →
 * level-up scene, so the biggest beat lands last (GAME_SYSTEM §5).
 */
export function GameEffectsProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [announcement, setAnnouncement] = useState("");
  const [levelUp, setLevelUp] = useState<CompletionOutcome | null>(null);

  const announce = useCallback((message: string) => {
    // Clear first so repeating the same text is announced again.
    setAnnouncement("");
    window.requestAnimationFrame(() => setAnnouncement(message));
  }, []);

  const celebrate = useCallback(
    (outcome: CompletionOutcome) => {
      const parts = [`퀘스트 완료! ${formatXpGain(outcome.xpChange)}`];
      if (outcome.goalClear) {
        parts.push(`퀘스트라인 클리어 보너스 ${formatXpGain(outcome.goalClear.bonus)}`);
        toast({
          tone: "success",
          message: `QUESTLINE CLEAR — ${outcome.goalClear.title} ${formatXpGain(outcome.goalClear.bonus)}`,
          duration: 7000,
        });
      }
      for (const badge of outcome.achievements) {
        parts.push(`업적 해금: ${badge.name}`);
        toast({
          tone: "success",
          message: `${RARITY_META[badge.rarity].label} 업적 해금 — ${badge.name}`,
          duration: 7000,
        });
      }
      if (outcome.levelUp) {
        parts.push(`레벨 ${outcome.levelUp.to} 달성`);
        setLevelUp(outcome);
      }
      announce(parts.join(". "));
    },
    [announce, toast],
  );

  const value = useMemo(() => ({ celebrate, announce }), [celebrate, announce]);

  return (
    <GameEffectsContext.Provider value={value}>
      {children}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <LevelUpDialog outcome={levelUp} onClose={() => setLevelUp(null)} />
    </GameEffectsContext.Provider>
  );
}

function LevelUpDialog({
  outcome,
  onClose,
}: {
  outcome: CompletionOutcome | null;
  onClose: () => void;
}) {
  const up = outcome?.levelUp;
  const newTitle = up ? titleForLevel(up.to) : null;
  const titleChanged = up ? titleForLevel(up.from).ko !== newTitle?.ko : false;

  return (
    <Dialog
      open={Boolean(up)}
      onClose={onClose}
      title="LEVEL UP!"
      description={outcome ? `${outcome.character.name}이(가) 한 단계 성장했어요.` : undefined}
      footer={
        <PixelButton variant="accent" block onClick={onClose}>
          계속 모험하기
        </PixelButton>
      }
    >
      {outcome && up && (
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <CharacterSprite
            outfit={outcome.character.outfit}
            state="level-up"
            scale={4}
            label={`${outcome.character.name}의 캐릭터`}
          />
          <div className="pixel-pop flex items-baseline gap-3">
            <span className="font-pixel text-pixel text-text-muted">Lv.{up.from}</span>
            <span aria-hidden className="text-text-muted">
              →
            </span>
            <LevelBadge level={up.to} />
          </div>
          {titleChanged && newTitle && (
            <p className="text-small">
              새 칭호 <strong className="font-semibold text-xp-text">{newTitle.ko}</strong>
            </p>
          )}
        </div>
      )}
    </Dialog>
  );
}

export function useGameEffects(): GameEffects {
  const effects = useContext(GameEffectsContext);
  if (!effects) throw new Error("useGameEffects must be used inside <GameEffectsProvider>");
  return effects;
}
