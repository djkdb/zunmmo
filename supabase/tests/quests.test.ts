import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { asUser, createUser, dbAvailable, deleteUsers, pool } from "./db";

const available = await dbAvailable();

const quest = (overrides: Record<string, unknown> = {}) => ({
  title: "AI 강의 복습",
  type: "side",
  difficulty: 3,
  xp: 70,
  primary_stat: "int",
  ...overrides,
});

function insertQuest(q: Record<string, unknown>) {
  const cols = Object.keys(q);
  return {
    text: `insert into quests (${cols.join(", ")}) values (${cols.map((_, i) => `$${i + 1}`).join(", ")}) returning *`,
    values: Object.values(q).map((v) =>
      v !== null && typeof v === "object" ? JSON.stringify(v) : v,
    ),
  };
}

describe.skipIf(!available)("goals & quests", () => {
  let alice: string;
  let bob: string;
  let aliceGoal: string;

  beforeAll(async () => {
    alice = await createUser();
    bob = await createUser();
    aliceGoal = await asUser(alice, async (c) => {
      const { rows } = await c.query(
        "insert into goals (title) values ('웹서비스 출시') returning id",
      );
      return rows[0].id as string;
    });
  });

  afterAll(async () => {
    await deleteUsers([alice, bob]);
    await pool.end();
  });

  it("stores a quest owned by the caller", async () => {
    const row = await asUser(alice, async (c) => (await c.query(insertQuest(quest()))).rows[0]);
    expect(row).toMatchObject({ user_id: alice, status: "active", xp: 70 });
  });

  it("enforces per-type requirements", async () => {
    await expect(
      asUser(alice, (c) => c.query(insertQuest(quest({ type: "boss" })))),
    ).rejects.toThrow(/quests_boss_needs_deadline/);
    await expect(
      asUser(alice, (c) => c.query(insertQuest(quest({ type: "daily" })))),
    ).rejects.toThrow(/quests_daily_needs_repeat/);
    await expect(
      asUser(alice, (c) => c.query(insertQuest(quest({ type: "main" })))),
    ).rejects.toThrow(/quests_main_needs_goal/);
    const main = await asUser(
      alice,
      async (c) =>
        (await c.query(insertQuest(quest({ type: "main", goal_id: aliceGoal })))).rows[0],
    );
    expect(main.goal_id).toBe(aliceGoal);
  });

  it("bounds XP and difficulty", async () => {
    await expect(asUser(alice, (c) => c.query(insertQuest(quest({ xp: 5000 }))))).rejects.toThrow(
      /check constraint/,
    );
    await expect(
      asUser(alice, (c) => c.query(insertQuest(quest({ difficulty: 6 })))),
    ).rejects.toThrow(/check constraint/);
  });

  it("refuses to attach someone else's questline", async () => {
    await expect(
      asUser(bob, (c) => c.query(insertQuest(quest({ type: "main", goal_id: aliceGoal })))),
    ).rejects.toThrow(/NOT_FOUND/);
  });

  it("never lets clients set status or completion directly", async () => {
    await expect(
      asUser(alice, (c) => c.query(insertQuest(quest({ status: "completed" })))),
    ).rejects.toThrow(/permission denied/);
    await expect(
      asUser(alice, (c) => c.query("update quests set status = 'completed'")),
    ).rejects.toThrow(/permission denied/);
    await expect(
      asUser(alice, (c) => c.query("update quests set completed_at = now()")),
    ).rejects.toThrow(/permission denied/);
  });

  it("archives and restores through the RPC", async () => {
    const id = await asUser(
      alice,
      async (c) => (await c.query(insertQuest(quest({ title: "보관할 퀘스트" })))).rows[0].id,
    );
    const archived = await asUser(
      alice,
      async (c) => (await c.query("select * from set_quest_archived($1, true)", [id])).rows[0],
    );
    expect(archived.status).toBe("archived");
    const restored = await asUser(
      alice,
      async (c) => (await c.query("select * from set_quest_archived($1, false)", [id])).rows[0],
    );
    expect(restored.status).toBe("active");
    await expect(
      asUser(bob, (c) => c.query("select set_quest_archived($1, true)", [id])),
    ).rejects.toThrow(/QUEST_NOT_FOUND/);
  });

  it("splits a quest in place, keeping questline order", async () => {
    const ids = await asUser(alice, async (c) => {
      const { rows } = await c.query(
        `insert into quests (goal_id, title, type, difficulty, xp, primary_stat, sort_order)
         select $1, t.title, 'main', 3, 70, 'foc', t.n
           from (values ('기획', 0), ('결제 모듈 붙이기', 1), ('배포', 2)) as t(title, n)
         returning id, title`,
        [aliceGoal],
      );
      return Object.fromEntries(rows.map((r) => [r.title, r.id as string]));
    });
    const parts = [
      { title: "결제 API 조사", difficulty: 2, xp: 40, estimated_minutes: 40 },
      { title: "결제 화면", difficulty: 2, xp: 40, estimated_minutes: 40 },
    ];
    const returned = await asUser(alice, async (c) =>
      (
        await c.query("select split_quest($1, $2) as id", [
          ids["결제 모듈 붙이기"],
          JSON.stringify(parts),
        ])
      ).rows.map((r) => r.id),
    );
    expect(returned[0]).toBe(ids["결제 모듈 붙이기"]);
    const order = await asUser(alice, async (c) =>
      (
        await c.query(
          "select title from quests where goal_id = $1 and type = 'main' order by created_at, sort_order",
          [aliceGoal],
        )
      ).rows.map((r) => r.title),
    );
    expect(order.slice(-4)).toEqual(["기획", "결제 API 조사", "결제 화면", "배포"]);

    await expect(
      asUser(bob, (c) =>
        c.query("select split_quest($1, $2)", [ids["배포"], JSON.stringify(parts)]),
      ),
    ).rejects.toThrow(/QUEST_NOT_FOUND/);
    await expect(
      asUser(alice, (c) =>
        c.query("select split_quest($1, $2)", [ids["배포"], JSON.stringify(parts.slice(0, 1))]),
      ),
    ).rejects.toThrow(/VALIDATION_FAILED/);
  });

  it("isolates players", async () => {
    const seen = await asUser(bob, async (c) => ({
      quests: (await c.query("select 1 from quests")).rowCount,
      goals: (await c.query("select 1 from goals")).rowCount,
      updated: (await c.query("update quests set title = 'hacked'")).rowCount,
      deleted: (await c.query("delete from quests")).rowCount,
    }));
    expect(seen).toEqual({ quests: 0, goals: 0, updated: 0, deleted: 0 });
  });
});
