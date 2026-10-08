import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { startNewGame } from "./helpers";

/** WCAG 2.1 AA via axe on every main screen (CLAUDE.md 접근성). Extend the list as screens ship. */
const PUBLIC_PAGES = ["/", "/login"];
const PLAYER_PAGES = ["/adventure", "/quests", "/quests/new", "/settings", "/character"];

async function audit(page: import("@playwright/test").Page) {
  await page.waitForLoadState("networkidle");
  await expect(page.locator("main").filter({ visible: true }).first()).toBeVisible();
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    // The Next dev overlay is not part of the product.
    .exclude("nextjs-portal")
    .analyze();
  return violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

test("public pages have no WCAG 2.1 AA violations", async ({ page }) => {
  for (const path of PUBLIC_PAGES) {
    await page.goto(path);
    expect(await audit(page), path).toEqual([]);
  }
});

test("player pages have no WCAG 2.1 AA violations", async ({ page }) => {
  await startNewGame(page);
  for (const path of PLAYER_PAGES) {
    await page.goto(path);
    expect(await audit(page), path).toEqual([]);
  }
});
