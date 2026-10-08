import type { Metadata } from "next";
import Link from "next/link";
import { type ReactNode, Suspense } from "react";

import { Button } from "@/components/ui/Button";
import { signOut } from "@/features/auth/actions";
import { requireCharacter } from "@/features/player/queries";
import { CharacterSettingsForm } from "@/features/settings/components/CharacterSettingsForm";
import { DeleteAccount } from "@/features/settings/components/DeleteAccount";
import { PreferencesForm } from "@/features/settings/components/PreferencesForm";

export const metadata: Metadata = { title: "설정" };

const SAVED_MESSAGE: Record<string, string> = {
  preferences: "플레이 설정을 저장했어요.",
  character: "캐릭터를 저장했어요.",
};

function Panel({
  id,
  title,
  children,
  tone,
}: {
  id: string;
  title: string;
  children: ReactNode;
  tone?: "danger";
}) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className={
        tone === "danger"
          ? "flex flex-col gap-4 rounded-sm border border-danger p-5"
          : "flex flex-col gap-4 rounded-sm border border-border bg-surface p-5"
      }
    >
      <h2 id={`${id}-title`} className="text-h2">
        {title}
      </h2>
      {children}
    </section>
  );
}

async function Settings({
  searchParams,
}: {
  searchParams: PageProps<"/settings">["searchParams"];
}) {
  const [player, params] = await Promise.all([requireCharacter(), searchParams]);
  const saved = typeof params.saved === "string" ? SAVED_MESSAGE[params.saved] : undefined;
  return (
    <>
      {saved && (
        <p role="status" className="text-small text-success-text">
          {saved}
        </p>
      )}
      <Panel id="character" title="캐릭터">
        <CharacterSettingsForm name={player.character.name} outfit={player.character.outfit} />
      </Panel>
      <Panel id="play" title="플레이 설정">
        <PreferencesForm
          initial={{
            timezone: player.profile.timezone,
            dayStartHour: player.profile.dayStartHour,
            dailyCapacityMin: player.profile.dailyCapacityMin,
          }}
        />
      </Panel>
      <Panel id="account" title="계정">
        <dl className="flex flex-col gap-1">
          <dt className="text-small text-text-muted">로그인 이메일</dt>
          <dd className="text-body">{player.email ?? "—"}</dd>
        </dl>
        <form action={signOut}>
          <Button type="submit">로그아웃</Button>
        </form>
      </Panel>
      <Panel id="danger" title="계정 삭제" tone="danger">
        <p className="text-small text-text-secondary">
          모든 기록이 즉시 지워져요. 자세한 내용은{" "}
          <Link href="/privacy" className="text-primary-text underline underline-offset-2">
            개인정보처리방침
          </Link>
          을 확인해 주세요.
        </p>
        <div>
          <DeleteAccount />
        </div>
      </Panel>
    </>
  );
}

export default function SettingsPage({ searchParams }: PageProps<"/settings">) {
  return (
    <div className="flex max-w-xl flex-col gap-8">
      <header className="flex flex-col gap-1">
        <p className="font-pixel text-pixel text-text-muted">SETTINGS</p>
        <h1 className="text-h1">설정</h1>
      </header>
      <Suspense fallback={<div aria-hidden className="pixel-skeleton h-96 w-full" />}>
        <Settings searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
