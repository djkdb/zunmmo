import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/game/EmptyState";

export const metadata: Metadata = { title: "찾을 수 없어요" };

/** 404 for every route (UI_GUIDE §8): GM line + the way back. */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="flex flex-col items-center gap-2">
        <p className="font-pixel text-pixel-2x text-text-muted">404</p>
        <EmptyState
          icon="ui-adventure"
          message="이 길은 지도에 없어. 모험 화면으로 돌아가자."
          action={
            <Link
              href="/adventure"
              className="pixel-btn inline-flex min-h-11 items-center px-5 font-pixel text-pixel uppercase"
              data-variant="primary"
            >
              모험으로 돌아가기
            </Link>
          }
        />
      </div>
    </main>
  );
}
