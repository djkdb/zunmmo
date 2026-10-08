import Link from "next/link";

import { CharacterSprite } from "@/components/game/character/CharacterSprite";
import { PixelFrame } from "@/components/pixel/PixelFrame";

/** Closing call to action. Uses the primary variant — the accent CTA belongs to the hero. */
export function FinalCta() {
  return (
    <section
      aria-labelledby="final-cta-title"
      className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 lg:px-8"
    >
      <PixelFrame
        variant="raised"
        className="flex flex-col items-center gap-6 px-6 py-10 text-center sm:flex-row sm:text-left"
      >
        <CharacterSprite outfit="emerald" state="walking" scale={3} label="걸어가는 모험가" />
        <div className="flex flex-1 flex-col gap-2">
          <h2 id="final-cta-title" className="font-pixel text-pixel-2x">
            첫 퀘스트를 받으러 가자
          </h2>
          <p className="text-small text-text-secondary">가입은 이메일 하나로 30초면 끝나요.</p>
        </div>
        <Link
          href="/login"
          className="pixel-btn inline-flex min-h-14 items-center justify-center px-6 font-pixel text-pixel uppercase"
          data-variant="primary"
        >
          모험 시작하기
        </Link>
      </PixelFrame>
    </section>
  );
}
