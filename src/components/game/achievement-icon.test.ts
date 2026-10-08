import { describe, expect, it } from "vitest";

import { ICON_ATLAS } from "@/components/pixel/icons.generated";
import { ACHIEVEMENTS } from "@/lib/game";

import { achievementIcon } from "./achievement-icon";

describe("achievement icons", () => {
  it("every badge points at a drawn icon", () => {
    const names: readonly string[] = ICON_ATLAS.names;
    for (const a of ACHIEVEMENTS) expect(names, a.id).toContain(a.icon);
  });

  it("falls back for unknown names", () => {
    expect(achievementIcon("nope")).toBe("ui-sword");
    expect(achievementIcon("quest-boss")).toBe("quest-boss");
  });
});
