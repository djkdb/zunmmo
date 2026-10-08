"use client";

import "./globals.css";

/**
 * Last-resort error page when the root layout itself fails. It renders its own document,
 * so it imports the global styles directly and keeps to plain text + one retry.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="ko">
      <body className="flex min-h-dvh items-center justify-center bg-bg p-6 text-text">
        <title>LIFE RPG</title>
        <main role="alert" className="flex max-w-sm flex-col items-center gap-4 text-center">
          <p className="font-pixel text-pixel text-text-muted">ERROR</p>
          <h1 className="text-h2">길이 잠깐 막혔어요</h1>
          <p className="text-small text-text-secondary">
            잠시 후 다시 시도해 주세요. 기록은 안전하게 저장되어 있어요.
            {error.digest && (
              <span className="block text-caption text-text-muted">코드 {error.digest}</span>
            )}
          </p>
          <button
            type="button"
            onClick={() => retry()}
            className="pixel-btn inline-flex min-h-11 items-center px-5 font-pixel text-pixel uppercase"
            data-variant="primary"
          >
            다시 시도
          </button>
        </main>
      </body>
    </html>
  );
}
