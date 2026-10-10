// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BattleMonster } from "./BattleMonster";

const sprite = (container: HTMLElement) => container.querySelector("span")!;

describe("BattleMonster", () => {
  it("idles, plays the defeat sequence once the quest is done, and stands up on undo", () => {
    const { container, rerender } = render(<BattleMonster name="slime" defeated={false} />);
    expect(sprite(container).className).toContain("monster-idle");

    rerender(<BattleMonster name="slime" defeated />);
    expect(sprite(container).className).toContain("monster-defeat");

    rerender(<BattleMonster name="slime" defeated={false} />);
    expect(sprite(container).className).toContain("monster-idle");
  });

  it("just lies defeated when the quest was already done", () => {
    const { container } = render(<BattleMonster name="dragon" defeated />);
    expect(sprite(container).className).not.toContain("monster-defeat");
    expect(sprite(container).style.backgroundPosition).toContain("-2");
  });
});
