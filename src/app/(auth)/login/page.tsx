import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { CharacterSprite } from "@/components/game/character/CharacterSprite";
import { PixelFrame } from "@/components/pixel/PixelFrame";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { safeNextPath } from "@/features/auth/schemas";
import { googleAuthEnabled } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "로그인" };

const LOGIN_ERRORS: Record<string, string> = {
  link: "로그인 링크가 만료됐거나 다른 브라우저에서 열렸어요. 이 브라우저에서 다시 받아 주세요.",
  oauth: "Google 로그인에 실패했어요. 다시 시도해 주세요.",
};

async function LoginFormWithParams({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : undefined);
  const errorKey = typeof params.error === "string" ? params.error : undefined;
  return (
    <LoginForm
      next={next}
      googleEnabled={googleAuthEnabled}
      initialError={errorKey ? LOGIN_ERRORS[errorKey] : undefined}
    />
  );
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-4 py-10">
      <Link href="/" className="self-center font-pixel text-pixel-2x text-text">
        LIFE RPG
      </Link>
      <PixelFrame className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-4">
          <CharacterSprite outfit="royal" scale={2} label="모험가" shadow={false} />
          <div className="flex flex-col gap-1">
            <h1 className="text-h2">모험에 입장하기</h1>
            <p className="text-small text-text-muted">이메일 하나면 충분해요.</p>
          </div>
        </div>
        <Suspense fallback={<div className="pixel-skeleton h-48" aria-hidden />}>
          <LoginFormWithParams searchParams={searchParams} />
        </Suspense>
      </PixelFrame>
    </main>
  );
}
