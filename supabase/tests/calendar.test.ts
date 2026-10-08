import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { asUser, createUser, dbAvailable, deleteUsers, pool } from "./db";

const available = await dbAvailable();

const newQuest = (title: string) =>
  `insert into quests (title, type, difficulty, xp, primary_stat) values ('${title}', 'side', 2, 40, 'vit') returning id`;

describe.skipIf(!available)("schedules & adventures", () => {
  let alice: string;
  let bob: string;
  let aliceQuest: string;
  let bobQuest: string;

  beforeAll(async () => {
    alice = await createUser();
    bob = await createUser();
    aliceQuest = await asUser(alice, async (c) => (await c.query(newQuest("축구"))).rows[0].id);
    bobQuest = await asUser(bob, async (c) => (await c.query(newQuest("독서"))).rows[0].id);
  });

  afterAll(async () => {
    await deleteUsers([alice, bob]);
    await pool.end();
  });

  it("stores a schedule linked to an own quest and hides it from others", async () => {
    const row = await asUser(
      alice,
      async (c) =>
        (
          await c.query(
            "insert into schedules (title, starts_at, ends_at, quest_id) values ('축구 경기', '2026-10-10T06:00:00Z', '2026-10-10T08:00:00Z', $1) returning *",
            [aliceQuest],
          )
        ).rows[0],
    );
    expect(row).toMatchObject({ user_id: alice, quest_id: aliceQuest, source: "manual" });
    const seen = await asUser(bob, async (c) => (await c.query("select id from schedules")).rows);
    expect(seen).toHaveLength(0);
  });

  it("rejects linking someone else's quest and end-before-start", async () => {
    await expect(
      asUser(alice, (c) =>
        c.query("insert into schedules (title, starts_at, quest_id) values ('x', now(), $1)", [
          bobQuest,
        ]),
      ),
    ).rejects.toThrow(/row-level security/);
    await expect(
      asUser(alice, (c) =>
        c.query(
          "insert into schedules (title, starts_at, ends_at) values ('x', '2026-10-10T08:00:00Z', '2026-10-10T07:00:00Z')",
        ),
      ),
    ).rejects.toThrow(/schedules_ends_after_start/);
  });

  it("keeps one adventure per game day, with own quests only", async () => {
    const insert = (ids: string[]) =>
      asUser(alice, (c) =>
        c.query(
          `insert into adventures (game_date, quest_ids) values ('2026-10-08', $1)
           on conflict (user_id, game_date) do update set quest_ids = excluded.quest_ids
           returning quest_ids`,
          [ids],
        ),
      );
    await expect(insert([bobQuest])).rejects.toThrow(/row-level security/);
    await insert([aliceQuest]);
    await insert([aliceQuest]);
    const rows = await asUser(alice, async (c) => (await c.query("select * from adventures")).rows);
    expect(rows).toHaveLength(1);
    expect(rows[0].quest_ids).toEqual([aliceQuest]);
  });

  it("blocks anonymous access", async () => {
    await expect(asUser(null, (c) => c.query("select * from adventures"))).rejects.toThrow(
      /permission denied/,
    );
  });
});
