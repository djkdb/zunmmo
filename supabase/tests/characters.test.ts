import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { APPEARANCE, asUser, createUser, dbAvailable, deleteUsers, pool } from "./db";

const available = await dbAvailable();

describe.skipIf(!available)("profiles & characters (RLS + create_character)", () => {
  let alice: string;
  let bob: string;

  beforeAll(async () => {
    alice = await createUser();
    bob = await createUser();
  });

  afterAll(async () => {
    await deleteUsers([alice, bob]);
    await pool.end();
  });

  it("creates a profile for every new auth user", async () => {
    const { rows } = await asUser(alice, (c) =>
      c.query("select display_name, timezone, day_start_hour from profiles"),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ timezone: "Asia/Seoul", day_start_hour: 4 });
    expect(rows[0].display_name).toMatch(/^player-/);
  });

  it("create_character makes the character, five stats and marks onboarding", async () => {
    const character = await asUser(alice, async (c) => {
      const { rows } = await c.query("select * from create_character($1, $2)", [
        "  성준 ",
        APPEARANCE,
      ]);
      return rows[0];
    });
    expect(character).toMatchObject({ name: "성준", total_xp: "0" });

    const stats = await asUser(alice, (c) =>
      c.query("select stat, xp from character_stats order by stat"),
    );
    expect(stats.rows.map((r) => r.stat)).toEqual(["int", "foc", "vit", "soc", "cre"]);

    const profile = await asUser(alice, (c) => c.query("select onboarded_at from profiles"));
    expect(profile.rows[0].onboarded_at).not.toBeNull();
  });

  it("allows only one character per player", async () => {
    await expect(
      asUser(alice, (c) => c.query("select create_character($1, $2)", ["둘째", APPEARANCE])),
    ).rejects.toThrow(/CHARACTER_EXISTS/);
  });

  it("rejects anonymous callers", async () => {
    await expect(
      asUser(null, (c) => c.query("select create_character($1, $2)", ["익명", APPEARANCE])),
    ).rejects.toThrow(/permission denied/);
  });

  it("hides other players' rows", async () => {
    const seen = await asUser(bob, async (c) => ({
      characters: (await c.query("select id from characters")).rowCount,
      stats: (await c.query("select 1 from character_stats")).rowCount,
      profiles: (await c.query("select id from profiles")).rows.map((r) => r.id),
    }));
    expect(seen).toEqual({ characters: 0, stats: 0, profiles: [bob] });
  });

  it("lets players rename but never write XP", async () => {
    await asUser(alice, (c) => c.query("update characters set name = '준'"));
    await expect(
      asUser(alice, (c) => c.query("update characters set total_xp = 99999")),
    ).rejects.toThrow(/permission denied/);
    await expect(
      asUser(alice, (c) => c.query("update character_stats set xp = 5")),
    ).rejects.toThrow(/permission denied/);
    await expect(
      asUser(alice, (c) =>
        c.query("insert into characters (user_id, name, appearance) values ($1, 'x', $2)", [
          alice,
          APPEARANCE,
        ]),
      ),
    ).rejects.toThrow(/permission denied/);
  });

  it("validates character names", async () => {
    const carol = await createUser();
    try {
      await expect(
        asUser(carol, (c) => c.query("select create_character($1, $2)", ["   ", APPEARANCE])),
      ).rejects.toThrow(/check constraint/);
      await expect(
        asUser(carol, (c) =>
          c.query("select create_character($1, $2)", [
            "열일곱글자가넘는아주아주긴캐릭터이름",
            APPEARANCE,
          ]),
        ),
      ).rejects.toThrow(/check constraint/);
    } finally {
      await deleteUsers([carol]);
    }
  });
});
