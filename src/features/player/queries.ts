import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import type { OutfitPreset } from "@/components/game/character/CharacterSprite";
import { outfitOf } from "@/features/character/schemas";
import { type GameDate, STATS, type Stat, gameDate } from "@/lib/game";
import { createClient } from "@/lib/supabase/server";

export interface Player {
  userId: string;
  email: string | null;
  profile: {
    displayName: string;
    timezone: string;
    dayStartHour: number;
    dailyCapacityMin: number;
  };
  character: {
    id: string;
    name: string;
    outfit: OutfitPreset;
    totalXp: number;
  } | null;
  statXp: Record<Stat, number>;
}

export type PlayerWithCharacter = Player & { character: NonNullable<Player["character"]> };

/**
 * Data Access Layer entry point: the signed-in player, once per request (React `cache`).
 * Redirects to /login when there is no session. Call only inside a <Suspense> boundary.
 */
export const getPlayer = cache(async (): Promise<Player> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileResult, characterResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, timezone, day_start_hour, daily_capacity_min")
      .single(),
    supabase
      .from("characters")
      .select("id, name, appearance, total_xp, character_stats (stat, xp)")
      .maybeSingle(),
  ]);
  if (profileResult.error) throw profileResult.error;
  if (characterResult.error) throw characterResult.error;

  const profile = profileResult.data;
  const row = characterResult.data;
  const statXp = Object.fromEntries(STATS.map((s) => [s, 0])) as Record<Stat, number>;
  for (const s of row?.character_stats ?? []) statXp[s.stat] = s.xp;

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: {
      displayName: profile.display_name,
      timezone: profile.timezone,
      dayStartHour: profile.day_start_hour,
      dailyCapacityMin: profile.daily_capacity_min,
    },
    character: row
      ? { id: row.id, name: row.name, outfit: outfitOf(row.appearance), totalXp: row.total_xp }
      : null,
    statXp,
  };
});

/** The player, or a redirect to onboarding when no character exists yet. */
export async function requireCharacter(): Promise<PlayerWithCharacter> {
  const player = await getPlayer();
  if (!player.character) redirect("/onboarding");
  return player as PlayerWithCharacter;
}

/** Today's game date for the player (their timezone and day-start hour, GAME_SYSTEM §1.6). */
export function playerToday(player: Pick<Player, "profile">, now: Date = new Date()): GameDate {
  return gameDate(now, player.profile.timezone, player.profile.dayStartHour);
}
