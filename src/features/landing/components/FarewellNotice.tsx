"use client";

import { useSearchParams } from "next/navigation";

/** Shown once after account deletion (/?farewell=1); the landing page itself stays static. */
export function FarewellNotice() {
  const params = useSearchParams();
  if (params.get("farewell") !== "1") return null;
  return (
    <p role="status" className="border-b border-border bg-surface px-4 py-3 text-center text-small">
      계정과 모든 기록을 지웠어요. 그동안 함께 모험해 줘서 고마워요.
    </p>
  );
}
