import { type GameDate, addDays } from "./time";

const MAX_LOOKBACK_DAYS = 400;

/**
 * Consecutive play streak ending today — or yesterday, so a streak isn't "lost" before
 * the player has had a chance to play today (GAME_SYSTEM §6).
 * `isDue` lets weekly habits skip days they weren't scheduled for.
 */
export function currentStreak(
  playedDates: Iterable<GameDate>,
  today: GameDate,
  isDue: (date: GameDate) => boolean = () => true,
): number {
  const played = new Set(playedDates);
  let day = played.has(today) ? today : addDays(today, -1);
  let streak = 0;
  for (let i = 0; i < MAX_LOOKBACK_DAYS; i++, day = addDays(day, -1)) {
    if (!isDue(day)) continue;
    if (!played.has(day)) break;
    streak++;
  }
  return streak;
}
