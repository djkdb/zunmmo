import "server-only";

import type { Player } from "@/features/player/queries";
import { playerToday } from "@/features/player/queries";
import {
  type GameDate,
  type ProgressSnapshot,
  type QuestType,
  type Stat,
  addDays,
  currentStreak,
} from "@/lib/game";
import { createClient } from "@/lib/supabase/server";

interface ProgressRow {
  completions: number;
  byType: Partial<Record<QuestType, number>>;
  goalsCleared: number;
  earlyBird: number;
  playDates: GameDate[];
}

export interface Progress {
  snapshot: ProgressSnapshot;
  playDates: GameDate[];
}

/** Aggregates for achievements and streaks (player_progress runs under the caller's RLS). */
export async function getProgress(
  player: Pick<Player, "profile" | "statXp"> & { totalXp: number },
): Promise<Progress> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("player_progress");
  if (error) throw error;
  const row = data as unknown as ProgressRow;
  const today = playerToday(player);
  return {
    playDates: row.playDates,
    snapshot: {
      completions: row.completions,
      byType: row.byType,
      goalsCleared: row.goalsCleared,
      earlyBird: row.earlyBird,
      totalXp: player.totalXp,
      statXp: player.statXp,
      adventureStreak: currentStreak(row.playDates, today),
    },
  };
}

export async function getUnlockedAchievements(): Promise<Map<string, string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_achievements")
    .select("achievement_id, unlocked_at");
  if (error) throw error;
  return new Map(data.map((r) => [r.achievement_id, r.unlocked_at]));
}

export interface CompletionLog {
  questId: string;
  occurrenceDate: GameDate;
}

/** Completions since `from` (inclusive) — today's dailies and this week's habit counts. */
export async function listCompletionsSince(from: GameDate): Promise<CompletionLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quest_completions")
    .select("quest_id, occurrence_date")
    .gte("occurrence_date", from);
  if (error) throw error;
  return data.map((r) => ({ questId: r.quest_id, occurrenceDate: r.occurrence_date }));
}

export interface XpLogView {
  id: string;
  amount: number;
  reason:
    "quest_complete" | "goal_clear" | "achievement" | "streak_bonus" | "reversal" | "admin_adjust";
  stat: Stat | null;
  title: string;
  createdAt: string;
  gameDate: GameDate | null;
}

/** Most recent ledger entries, newest first. */
export async function listRecentXp(limit = 5): Promise<XpLogView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("xp_logs")
    .select("id, amount, reason, stat, meta, created_at, quests (title), goals (title)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.map((r) => {
    const meta = (r.meta ?? {}) as { game_date?: string };
    return {
      id: r.id,
      amount: r.amount,
      reason: r.reason,
      stat: r.stat,
      title: r.quests?.title ?? r.goals?.title ?? "보너스",
      createdAt: r.created_at,
      gameDate: meta.game_date ?? null,
    };
  });
}

/** XP per game day for the last `days` days (oldest first), from the ledger. */
export async function xpByDay(
  today: GameDate,
  days = 7,
): Promise<Array<{ date: GameDate; xp: number }>> {
  const from = addDays(today, -(days - 1));
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("xp_logs")
    .select("amount, meta")
    .gte("created_at", new Date(Date.parse(`${from}T00:00:00Z`) - 86_400_000).toISOString());
  if (error) throw error;
  const totals = new Map<GameDate, number>();
  for (let i = 0; i < days; i++) totals.set(addDays(from, i), 0);
  for (const r of data) {
    const date = (r.meta as { game_date?: string } | null)?.game_date;
    if (date && totals.has(date)) totals.set(date, totals.get(date)! + r.amount);
  }
  return [...totals].map(([date, xp]) => ({ date, xp }));
}
