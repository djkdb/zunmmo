import { describe, expect, it } from "vitest";

import { STATS } from "@/lib/game";

import { BOSS_MONSTER, MONSTER_BY_STAT, monsterFor } from "./monster";
import { MONSTER_SHEETS } from "./monsters.generated";

describe("monsterFor", () => {
  it("gives every boss the dragon and every other quest its stat's enemy", () => {
    expect(monsterFor("boss", "vit")).toBe(BOSS_MONSTER);
    expect(monsterFor("daily", "int").name).toBe("tome");
    expect(monsterFor("side", "vit").name).toBe("slime");
  });

  it("has a distinct, built sprite sheet for every stat", () => {
    const names = STATS.map((s) => MONSTER_BY_STAT[s].name);
    expect(new Set(names).size).toBe(STATS.length);
    for (const name of [...names, BOSS_MONSTER.name]) {
      expect(MONSTER_SHEETS[name].frames).toBe(4);
    }
  });
});
