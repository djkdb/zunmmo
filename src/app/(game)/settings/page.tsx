import type { Metadata } from "next";
import { Suspense } from "react";

import { Button } from "@/components/ui/Button";
import { signOut } from "@/features/auth/actions";
import { getPlayer } from "@/features/player/queries";

export const metadata: Metadata = { title: "설정" };

async function Account() {
  const player = await getPlayer();
  return (
    <dl className="flex flex-col gap-1">
      <dt className="text-small text-text-muted">로그인 이메일</dt>
      <dd className="text-body">{player.email ?? "—"}</dd>
    </dl>
  );
}

export default function SettingsPage() {
  return (
    <div className="flex max-w-xl flex-col gap-8">
      <h1 className="text-h1">설정</h1>
      <section
        aria-labelledby="account-title"
        className="flex flex-col gap-4 rounded-sm border border-border bg-surface p-5"
      >
        <h2 id="account-title" className="text-h2">
          계정
        </h2>
        <Suspense fallback={<span className="pixel-skeleton block h-11 w-48" aria-hidden />}>
          <Account />
        </Suspense>
        <form action={signOut}>
          <Button type="submit">로그아웃</Button>
        </form>
      </section>
    </div>
  );
}
