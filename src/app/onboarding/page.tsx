import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { PixelFrame } from "@/components/pixel/PixelFrame";
import { OnboardingForm } from "@/features/character/components/OnboardingForm";
import { getPlayer } from "@/features/player/queries";

export const metadata: Metadata = { title: "캐릭터 만들기" };

async function OnboardingGate() {
  const player = await getPlayer();
  if (player.character) redirect("/adventure");
  return <OnboardingForm defaultName={player.profile.displayName} />;
}

export default function OnboardingPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      <header className="flex flex-col gap-2 text-center">
        <p className="font-pixel text-pixel text-accent">NEW GAME</p>
        <h1 className="text-h1">나의 모험가를 만들어요</h1>
        <p className="text-small text-text-muted">이 캐릭터가 당신과 함께 성장해요.</p>
      </header>
      <PixelFrame className="p-6">
        <Suspense fallback={<div className="pixel-skeleton h-96" aria-hidden />}>
          <OnboardingGate />
        </Suspense>
      </PixelFrame>
    </main>
  );
}
