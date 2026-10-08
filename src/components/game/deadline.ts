import { type GameDate, daysBetween } from "@/lib/game";

export type DeadlineTone = "danger" | "warning" | "muted";

export interface DeadlineStatus {
  /** "D-day", "D-3", "기한 만료" — color is never the only signal (UI_GUIDE §5.3). */
  label: string;
  tone: DeadlineTone;
  daysLeft: number;
}

/** D-day → danger, D-1..3 → warning, later → muted, past → "기한 만료" (never "실패"). */
export function deadlineStatus(deadline: GameDate, today: GameDate): DeadlineStatus {
  const daysLeft = daysBetween(today, deadline);
  if (daysLeft < 0) return { label: "기한 만료", tone: "muted", daysLeft };
  if (daysLeft === 0) return { label: "D-day", tone: "danger", daysLeft };
  return { label: `D-${daysLeft}`, tone: daysLeft <= 3 ? "warning" : "muted", daysLeft };
}
