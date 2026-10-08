import path from "node:path";

import { expect, test } from "@playwright/test";

/**
 * Visual regression for the pixel system: `VISUAL=1 pnpm test:e2e visual`
 * (update with `--update-snapshots` after an intended art change). Reduced motion freezes
 * sprites on their first frame so captures are deterministic.
 */
test.skip(!process.env.VISUAL, "set VISUAL=1 to compare visual snapshots");

const SECTIONS = ["art", "pixel", "game"] as const;

test.use({ contextOptions: { reducedMotion: "reduce" } });

for (const id of SECTIONS) {
  test(`styleguide #${id} matches its snapshot`, async ({ page }) => {
    await page.goto("/styleguide");
    await page.evaluate(() => document.fonts.ready);
    const section = page.locator(`section#${id}`);
    await expect(section).toBeVisible();
    await expect(section).toHaveScreenshot(`${id}.png`, {
      maxDiffPixelRatio: 0.002,
      stylePath: path.join(__dirname, "visual.css"),
    });
  });
}
