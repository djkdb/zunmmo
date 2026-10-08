/**
 * Test-only world builder for persona simulations: a player's profile, quests, schedules and
 * past play, written straight into the local database. XP still flows through the real
 * complete_quest RPC; only the timestamps are moved into the past afterwards.
 */
import type pg from "pg";

import {
  type Difficulty,
  type GameDate,
  type QuestType,
  addDays,
  gameDate,
  questXp,
} from "../src/lib/game";
import { fromLocal } from "../src/lib/utils/zoned";
import { userIdFor, withDb } from "./seed";

export interface WorldQuest {
  title: string;
  type: QuestType;
  difficulty: Difficulty;
  stat: "int" | "foc" | "vit" | "soc" | "cre";
  deadlineInDays?: number;
  repeat?: object;
  /** Questline title; created on first use. */
  goal?: string;
  minutes?: number;
  createdDaysAgo?: number;
}

export interface World {
  profile?: { timezone?: string; dayStartHour?: number; capacity?: number };
  quests?: WorldQuest[];
  schedules?: Array<{
    title: string;
    dayOffset: number;
    start: string;
    end?: string;
    allDay?: boolean;
  }>;
  /** Completions to replay, oldest first. */
  history?: Array<{ title: string; daysAgo: number }>;
}

/** An IANA zone (Etc/GMT±N) whose local clock currently reads `hour` — for late-night runs. */
export function zoneAtLocalHour(hour: number, now = new Date()): string {
  let offset = hour - now.getUTCHours();
  if (offset > 14) offset -= 24;
  if (offset < -12) offset += 24;
  if (offset === 0) return "Etc/GMT";
  // Etc/GMT signs are inverted: Etc/GMT-9 is UTC+9.
  return offset > 0 ? `Etc/GMT-${offset}` : `Etc/GMT+${-offset}`;
}

async function asPlayer<T>(c: pg.Client, userId: string, fn: () => Promise<T>): Promise<T> {
  await c.query("begin");
  await c.query("set local role authenticated");
  await c.query("select set_config('request.jwt.claims', $1, true)", [
    JSON.stringify({ sub: userId, role: "authenticated" }),
  ]);
  try {
    const result = await fn();
    await c.query("commit");
    return result;
  } catch (error) {
    await c.query("rollback");
    throw error;
  }
}

export async function buildWorld(email: string, world: World): Promise<Map<string, string>> {
  const userId = await userIdFor(email);
  const ids = new Map<string, string>();
  await withDb(async (c) => {
    const p = world.profile ?? {};
    await c.query(
      `update profiles set
         timezone = coalesce($2, timezone),
         day_start_hour = coalesce($3, day_start_hour),
         daily_capacity_min = coalesce($4, daily_capacity_min)
       where id = $1`,
      [userId, p.timezone ?? null, p.dayStartHour ?? null, p.capacity ?? null],
    );
    const { rows: prof } = await c.query(
      "select timezone, day_start_hour from profiles where id = $1",
      [userId],
    );
    const tz: string = prof[0].timezone;
    const today: GameDate = gameDate(new Date(), tz, prof[0].day_start_hour);

    const goals = new Map<string, string>();
    for (const [i, q] of (world.quests ?? []).entries()) {
      let goalId: string | null = null;
      if (q.goal) {
        goalId = goals.get(q.goal) ?? null;
        if (!goalId) {
          goalId = (
            await c.query("insert into goals (user_id, title) values ($1, $2) returning id", [
              userId,
              q.goal,
            ])
          ).rows[0].id as string;
          goals.set(q.goal, goalId);
        }
      }
      const created = new Date(Date.now() - (q.createdDaysAgo ?? 0) * 86_400_000).toISOString();
      const { rows } = await c.query(
        `insert into quests (user_id, goal_id, title, type, difficulty, xp, primary_stat, deadline,
                             repeat_rule, estimated_minutes, sort_order, created_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) returning id`,
        [
          userId,
          goalId,
          q.title,
          q.type,
          q.difficulty,
          questXp(q.type, q.difficulty),
          q.stat,
          q.deadlineInDays === undefined ? null : addDays(today, q.deadlineInDays),
          q.repeat ? JSON.stringify(q.repeat) : null,
          q.minutes ?? null,
          i,
          created,
        ],
      );
      ids.set(q.title, rows[0].id);
    }

    for (const s of world.schedules ?? []) {
      const date = addDays(today, s.dayOffset);
      await c.query(
        "insert into schedules (user_id, title, starts_at, ends_at, all_day) values ($1, $2, $3, $4, $5)",
        [
          userId,
          s.title,
          fromLocal(date, s.allDay ? "00:00" : s.start, tz).toISOString(),
          s.end && !s.allDay ? fromLocal(date, s.end, tz).toISOString() : null,
          s.allDay ?? false,
        ],
      );
    }

    for (const h of world.history ?? []) {
      const questId = ids.get(h.title);
      if (!questId) throw new Error(`history: unknown quest ${h.title}`);
      const { rows } = await asPlayer(c, userId, () =>
        c.query("select (public.complete_quest($1)).completion_id", [questId]),
      );
      if (h.daysAgo === 0) continue;
      const date = addDays(today, -h.daysAgo);
      const at = new Date(Date.now() - h.daysAgo * 86_400_000).toISOString();
      await c.query(
        "update quest_completions set occurrence_date = $2, completed_at = $3 where id = $1",
        [rows[0].completion_id, date, at],
      );
      await c.query(
        `update xp_logs set created_at = $3, meta = meta || jsonb_build_object('game_date', $2::text)
          where completion_id = $1`,
        [rows[0].completion_id, date, at],
      );
      // A completed one-off quest from the past should also look completed in the past.
      await c.query("update quests set completed_at = $2 where id = $1 and status = 'completed'", [
        questId,
        at,
      ]);
    }
  });
  return ids;
}
