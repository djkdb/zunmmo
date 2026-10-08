import { describe, expect, it } from "vitest";

import { titleForLevel } from "../titles";

describe("titleForLevel", () => {
  it.each([
    [1, "견습 모험가"],
    [4, "견습 모험가"],
    [5, "모험가"],
    [19, "숙련 모험가"],
    [24, "베테랑"],
    [35, "영웅"],
    [74, "전설"],
    [99, "신화"],
  ])("Lv.%i → %s", (level, ko) => {
    expect(titleForLevel(level).ko).toBe(ko);
  });

  it("clamps out-of-range levels", () => {
    expect(titleForLevel(0).en).toBe("Novice");
    expect(titleForLevel(500).en).toBe("Mythic");
  });
});
