import type { Metadata } from "next";

import { FinalCta } from "@/features/landing/components/FinalCta";
import { Hero } from "@/features/landing/components/Hero";
import { HowToPlay } from "@/features/landing/components/HowToPlay";
import { Principles } from "@/features/landing/components/Principles";
import { QuestTypes } from "@/features/landing/components/QuestTypes";
import { SiteFooter } from "@/features/landing/components/SiteFooter";
import { SiteHeader } from "@/features/landing/components/SiteHeader";

export const metadata: Metadata = {
  title: { absolute: "LIFE RPG — 오늘의 할 일이 퀘스트가 된다" },
  description: "일정·목표·습관을 퀘스트로 바꾸고, 완료할 때마다 캐릭터가 성장하는 Life RPG.",
};

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <HowToPlay />
        <QuestTypes />
        <Principles />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
