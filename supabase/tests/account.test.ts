import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { APPEARANCE, asUser, createUser, dbAvailable, deleteUsers, pool } from "./db";

const available = await dbAvailable();

describe.skipIf(!available)("account deletion", () => {
  let alice: string;
  let bob: string;

  beforeAll(async () => {
    alice = await createUser();
    bob = await createUser();
    for (const user of [alice, bob]) {
      await asUser(user, async (c) => {
        await c.query("select public.create_character('모험가', $1)", [JSON.stringify(APPEARANCE)]);
        const { rows } = await c.query(
          "insert into quests (title, type, difficulty, xp, primary_stat) values ('산책', 'side', 1, 20, 'vit') returning id",
        );
        await c.query("select public.complete_quest($1)", [rows[0].id]);
      });
    }
  });

  afterAll(async () => {
    await deleteUsers([alice, bob]);
    await pool.end();
  });

  it("refuses anonymous callers", async () => {
    await expect(asUser(null, (c) => c.query("select public.delete_my_account()"))).rejects.toThrow(
      /permission denied/,
    );
  });

  it("removes the caller and all their data, and nobody else's", async () => {
    await asUser(alice, (c) => c.query("select public.delete_my_account()"));
    const count = async (table: string, user: string) =>
      Number(
        (
          await pool.query(
            `select count(*) from ${table} where ${table === "auth.users" ? "id" : "user_id"} = $1`,
            [user],
          )
        ).rows[0].count,
      );
    for (const table of [
      "auth.users",
      "public.characters",
      "public.quests",
      "public.xp_logs",
      "public.quest_completions",
    ]) {
      expect(await count(table, alice), table).toBe(0);
      expect(await count(table, bob), table).toBeGreaterThan(0);
    }
  });
});
