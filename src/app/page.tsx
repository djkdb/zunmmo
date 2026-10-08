import Link from "next/link";

import { CharacterSprite } from "@/components/game/character/CharacterSprite";

/**
 * Pre-launch splash. Phase 2 replaces this with the landing page (docs/ROADMAP.md).
 */
export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 text-center">
      <CharacterSprite outfit="royal" scale={4} label="LIFE RPG 모험가" />
      <div className="flex flex-col items-center gap-3">
        <h1 className="font-pixel text-pixel-3x">LIFE RPG</h1>
        <p className="max-w-sm text-body text-text-secondary">
          내 현실을 MMORPG처럼 플레이하는 곳. 곧 모험이 시작돼요.
        </p>
      </div>
      {process.env.NODE_ENV !== "production" && (
        <Link href="/styleguide" className="text-small text-primary-text hover:underline">
          Styleguide 보기 →
        </Link>
      )}
    </main>
  );
}
