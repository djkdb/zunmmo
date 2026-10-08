import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getPlayer } from "@/features/player/queries";
import { StarterQuestsForm } from "@/features/quests/components/StarterQuestsForm";

export const metadata: Metadata = { title: "첫 퀘스트 고르기" };

async function StarterGate() {
  const player = await getPlayer();
  if (!player.character) redirect("/onboarding");
  return <StarterQuestsForm />;
}

export default function StarterQuestsPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <p className="font-pixel text-pixel text-accent">FIRST QUESTS</p>
        <h1 className="text-h1">첫 퀘스트를 골라 볼까?</h1>
        <p className="text-small text-text-muted">
          게임 마스터가 고른 가벼운 퀘스트예요. 나중에 언제든 고치거나 보관할 수 있어요.
        </p>
        <Link
          href="/adventure"
          className="inline-flex min-h-11 items-center self-start text-small text-primary-text hover:underline"
        >
          나중에 고를게요
        </Link>
      </header>
      <Suspense fallback={<div className="pixel-skeleton h-96" aria-hidden />}>
        <StarterGate />
      </Suspense>
    </main>
  );
}
