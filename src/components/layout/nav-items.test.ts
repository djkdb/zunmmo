import { describe, expect, it } from "vitest";

import { activeHref } from "./nav-items";

describe("activeHref", () => {
  it.each([
    ["/adventure", "/adventure"],
    ["/quests", "/quests"],
    ["/quests/abc", "/quests"],
    ["/quests/new", "/quests/new"],
    ["/settings", null],
  ])("%s → %s", (path, href) => {
    expect(activeHref(path)).toBe(href);
  });
});
