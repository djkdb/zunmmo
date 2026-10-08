import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { gameDate } from "../../src/lib/game";
import { APPEARANCE, asUser, createUser, dbAvailable, deleteUsers, pool } from "./db";

const available = await dbAvailable();

async function newPlayer(): Promise<string> {
  const id = await createUser();
  await asUser(id, (c) => c.query("select create_character('테스터', $1)", [APPEARANCE]));
  return id;
}

async function addQuest(user: string, q: Record<string, unknown>): Promise<string> {
  const row = { title: "퀘스트", type: "side", difficulty: 3, xp: 70, primary_stat: "int", ...q };
  const cols = Object.keys(row);
  const values = Object.values(row).map((v) =>
    v !== null && typeof v === "object" ? JSON.stringify(v) : v,
  );
  return asUser(user, async (c) => {
    const { rows } = await c.query(
      `insert into quests (${cols.join(",")}) values (${cols.map((_, i) => `$${i + 1}`).join(",")}) returning id`,
      values,
    );
    return rows[0].id;
  });
}

const totals = (user: string) =>
  asUser(user, async (c) => {
    const ch = (await c.query("select total_xp from characters")).rows[0];
    const ledger = (await c.query("select coalesce(sum(amount), 0) as sum from xp_logs")).rows[0];
    const stats = (await c.query("select stat, xp from character_stats")).rows;
    return {
      total: Number(ch.total_xp),
      ledger: Number(ledger.sum),
      stats: Object.fromEntries(stats.map((s) => [s.stat, Number(s.xp)])),
    };
  });

describe.skipIf(!available)("XP ledger RPCs", () => {
  const users: string[] = [];
  let player: string;

  beforeAll(async () => {
    player = await newPlayer();
    users.push(player);
  });

  afterAll(async () => {
    await deleteUsers(users);
    await pool.end();
  });

  it("game_date_at matches lib/game gameDate()", async () => {
    const cases: Array<[string, string, number]> = [
      ["2026-10-08T18:59:59Z", "Asia/Seoul", 4],
      ["2026-10-08T19:00:00Z", "Asia/Seoul", 4],
      ["2026-10-08T15:00:00Z", "Asia/Seoul", 0],
      ["2026-12-31T17:00:00Z", "Asia/Seoul", 4],
      ["2026-11-01T06:30:00Z", "America/New_York", 4],
      ["2026-11-01T09:30:00Z", "America/New_York", 4],
    ];
    for (const [at, tz, start] of cases) {
      const { rows } = await pool.query("select game_date_at($1, $2, $3)::text as d", [
        tz,
        start,
        at,
      ]);
      expect(rows[0].d, `${at} ${tz}`).toBe(gameDate(new Date(at), tz, start));
    }
  });

  it("completes a one-off quest once: ledger, total, stat and status move together", async () => {
    const quest = await addQuest(player, { primary_stat: "foc", xp: 120, difficulty: 4 });
    const result = await asUser(
      player,
      async (c) => (await c.query("select * from complete_quest($1)", [quest])).rows[0],
    );
    expect(result).toMatchObject({
      xp_change: 120,
      total_xp_before: "0",
      total_xp_after: "120",
      stat: "foc",
      stat_xp_after: "120",
    });

    const status = await asUser(
      player,
      async (c) =>
        (await c.query("select status, completed_at from quests where id = $1", [quest])).rows[0],
    );
    expect(status.status).toBe("completed");
    expect(status.completed_at).not.toBeNull();

    await expect(
      asUser(player, (c) => c.query("select complete_quest($1)", [quest])),
    ).rejects.toThrow(/QUEST_NOT_ACTIVE/);
    expect(await totals(player)).toMatchObject({ total: 120, ledger: 120 });
  });

  it("allows a daily once per game day", async () => {
    const daily = await addQuest(player, {
      type: "daily",
      repeat_rule: { freq: "daily" },
      xp: 40,
      difficulty: 2,
      primary_stat: "vit",
    });
    await asUser(player, (c) => c.query("select complete_quest($1)", [daily]));
    await expect(
      asUser(player, (c) => c.query("select complete_quest($1)", [daily])),
    ).rejects.toThrow(/ALREADY_COMPLETED/);
    const q = await asUser(
      player,
      async (c) => (await c.query("select status from quests where id = $1", [daily])).rows[0],
    );
    expect(q.status).toBe("active");
  });

  it("grants XP exactly once under concurrent completion", async () => {
    const racer = await newPlayer();
    users.push(racer);
    const quest = await addQuest(racer, { xp: 200, difficulty: 5 });
    const outcomes = await Promise.allSettled(
      Array.from({ length: 6 }, () =>
        asUser(racer, (c) => c.query("select complete_quest($1)", [quest])),
      ),
    );
    expect(outcomes.filter((o) => o.status === "fulfilled")).toHaveLength(1);
    expect(await totals(racer)).toMatchObject({ total: 200, ledger: 200 });
  });

  it("undo writes a reversal, restores the quest and keeps the ledger consistent", async () => {
    const undoer = await newPlayer();
    users.push(undoer);
    const quest = await addQuest(undoer, { xp: 70, primary_stat: "cre" });
    await asUser(undoer, (c) => c.query("select complete_quest($1)", [quest]));
    const undo = await asUser(
      undoer,
      async (c) => (await c.query("select * from uncomplete_quest($1)", [quest])).rows[0],
    );
    expect(undo).toMatchObject({ xp_change: -70, total_xp_after: "0" });

    const logs = await asUser(
      undoer,
      async (c) => (await c.query("select amount, reason from xp_logs order by created_at")).rows,
    );
    expect(logs).toEqual([
      { amount: 70, reason: "quest_complete" },
      { amount: -70, reason: "reversal" },
    ]);
    expect(await totals(undoer)).toMatchObject({ total: 0, ledger: 0, stats: { cre: 0 } });
    const q = await asUser(
      undoer,
      async (c) => (await c.query("select status from quests where id = $1", [quest])).rows[0],
    );
    expect(q.status).toBe("active");

    // Can complete again after undo, and undoing twice is refused.
    await asUser(undoer, (c) => c.query("select complete_quest($1)", [quest]));
    await asUser(undoer, (c) => c.query("select uncomplete_quest($1)", [quest]));
    await expect(
      asUser(undoer, (c) => c.query("select uncomplete_quest($1)", [quest])),
    ).rejects.toThrow(/UNDO_WINDOW_PASSED/);
  });

  it("refuses an undo from a previous game day", async () => {
    const quest = await addQuest(player, { xp: 20, difficulty: 1 });
    await asUser(player, (c) => c.query("select complete_quest($1)", [quest]));
    await pool.query(
      "update quest_completions set occurrence_date = occurrence_date - 1 where quest_id = $1",
      [quest],
    );
    await expect(
      asUser(player, (c) => c.query("select uncomplete_quest($1)", [quest])),
    ).rejects.toThrow(/UNDO_WINDOW_PASSED/);
  });

  it("clears a finished questline once, with a bounded bonus", async () => {
    const clearer = await newPlayer();
    users.push(clearer);
    const goal = await asUser(
      clearer,
      async (c) =>
        (await c.query("insert into goals (title) values ('라인') returning id")).rows[0].id,
    );
    const step = await addQuest(clearer, { type: "main", goal_id: goal, xp: 70 });

    await expect(
      asUser(clearer, (c) => c.query("select clear_goal($1, 200)", [goal])),
    ).rejects.toThrow(/QUEST_NOT_ACTIVE/);
    await asUser(clearer, (c) => c.query("select complete_quest($1)", [step]));
    await expect(
      asUser(clearer, (c) => c.query("select clear_goal($1, 5000)", [goal])),
    ).rejects.toThrow(/VALIDATION_FAILED/);
    const cleared = await asUser(
      clearer,
      async (c) => (await c.query("select * from clear_goal($1, 200)", [goal])).rows[0],
    );
    expect(cleared).toMatchObject({ xp_change: 200, total_xp_after: "270" });
    await expect(
      asUser(clearer, (c) => c.query("select clear_goal($1, 200)", [goal])),
    ).rejects.toThrow(/NOT_FOUND/);
    expect(await totals(clearer)).toMatchObject({ total: 270, ledger: 270 });
  });

  it("keeps the ledger and completions closed to direct writes", async () => {
    const quest = await addQuest(player, {});
    await expect(
      asUser(player, (c) =>
        c.query(
          "insert into xp_logs (user_id, character_id, amount, reason) select $1, id, 999, 'quest_complete' from characters",
          [player],
        ),
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(
      asUser(player, (c) =>
        c.query(
          "insert into quest_completions (quest_id, user_id, occurrence_date) values ($1, $2, current_date)",
          [quest, player],
        ),
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(asUser(player, (c) => c.query("delete from xp_logs"))).rejects.toThrow(
      /permission denied/,
    );
  });

  it("only lets players delete quests that never paid XP", async () => {
    const fresh = await addQuest(player, {});
    const played = await addQuest(player, {});
    await asUser(player, (c) => c.query("select complete_quest($1)", [played]));
    const deleted = await asUser(player, async (c) => ({
      fresh: (await c.query("delete from quests where id = $1", [fresh])).rowCount,
      played: (await c.query("delete from quests where id = $1", [played])).rowCount,
    }));
    expect(deleted).toEqual({ fresh: 1, played: 0 });
  });

  it("unlocks badges idempotently and only for yourself", async () => {
    await asUser(player, (c) =>
      c.query("insert into user_achievements (achievement_id) values ('first_step')"),
    );
    await expect(
      asUser(player, (c) =>
        c.query("insert into user_achievements (achievement_id) values ('first_step')"),
      ),
    ).rejects.toThrow(/duplicate key/);
    const other = await newPlayer();
    users.push(other);
    await expect(
      asUser(other, (c) =>
        c.query("insert into user_achievements (user_id, achievement_id) values ($1, 'x')", [
          player,
        ]),
      ),
    ).rejects.toThrow(/permission denied/);
  });
});
