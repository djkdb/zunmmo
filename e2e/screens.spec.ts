import { expect, test } from "@playwright/test";

import { readSignInCode, uniqueEmail } from "./helpers";
import { seedAdventure } from "./seed";

/**
 * Visual review captures (not assertions): `SCREENSHOTS=1 pnpm test:e2e screens`.
 * Images land in test-results/screens/<project>/.
 */
test.skip(!process.env.SCREENSHOTS, "set SCREENSHOTS=1 to capture review screenshots");

test("capture signed-in screens", async ({ page }, info) => {
  const dir = `test-results/screens/${info.project.name}`;
  const shot = async (name: string) => {
    await page.waitForLoadState("networkidle");
    // After a navigation Next reveals the new route on commit; wait until a <main> is shown.
    await expect(page.locator("main").filter({ visible: true }).first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    // Streaming content: wait until no skeletons remain.
    await expect(page.locator(".pixel-skeleton:visible")).toHaveCount(0);
    await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
    if (await page.getByText(/\d+ Issues?/).count()) {
      throw new Error(`Next dev overlay reports issues on ${name}`);
    }
  };

  await page.goto("/login");
  await shot("01-login");
  const email = uniqueEmail();
  await page.getByLabel("이메일").fill(email);
  await page.getByRole("button", { name: "입장 코드 받기" }).click();
  await expect(page.getByLabel("입장 코드")).toBeVisible();
  await shot("02-login-code");
  await page.getByLabel("입장 코드").fill(await readSignInCode(email));
  await page.getByRole("button", { name: "모험 입장" }).click();

  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByLabel("캐릭터 이름").fill("성준");
  await page.getByText("바이올렛", { exact: true }).click();
  await shot("03-onboarding");
  await page.getByRole("button", { name: "모험 시작" }).click();
  await expect(page).toHaveURL(/\/onboarding\/quests/);
  await shot("03b-starter-quests");
  await page.getByRole("link", { name: "나중에 고를게요" }).click();

  await expect(page).toHaveURL(/\/adventure/);
  await expect(page.locator("main header").filter({ visible: true })).toBeVisible();
  await shot("04-adventure-empty");

  await seedAdventure(email);
  await page.goto("/adventure");
  await shot("05-adventure");

  for (const path of (process.env.SCREEN_PATHS ?? "").split(",").filter(Boolean)) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await shot(`10-${path.replaceAll("/", "_")}`);
  }
});
