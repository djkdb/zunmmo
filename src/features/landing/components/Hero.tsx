import Link from "next/link";

import { PixelIcon } from "@/components/pixel/PixelIcon";

import { HeroScene } from "./HeroScene";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="flex flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 pt-6 pb-10 sm:px-6 lg:px-8 lg:pt-12">
        <p className="font-pixel text-pixel text-accent">LIFE RPG · 현실 플레이 RPG</p>
        <h1 id="hero-title" className="font-pixel text-pixel-3x text-text">
          오늘의 할 일이
          <br />
          퀘스트가 된다
        </h1>
        <p className="max-w-xl text-body text-text-secondary">
          과제·운동·취미를 메인·데일리·사이드·보스 퀘스트로 등록하세요. 하나씩 완료할 때마다 XP가
          쌓이고, 나의 캐릭터가 성장합니다.
        </p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-6">
          <Link
            href="/login"
            className="pixel-btn inline-flex min-h-14 items-center justify-center gap-3 px-6 font-pixel text-pixel uppercase"
            data-variant="accent"
          >
            <PixelIcon name="ui-sword" />
            <span>모험 시작하기</span>
          </Link>
          <a href="#how-to-play" className="text-small text-primary-text hover:underline">
            어떻게 플레이하나요? ↓
          </a>
        </div>
      </div>
      <HeroScene />
    </section>
  );
}
