import { expect, test } from "@playwright/test";

import { signIn, startNewGame } from "./helpers";

test("new player: sign in with code → create character → adventure → sign out", async ({
  page,
}) => {
  await startNewGame(page, "성준", "에메랄드");

  // Next keeps previous routes mounted but hidden (Activity), so scope to what is visible.
  const header = page.locator("main header").filter({ visible: true });
  await expect(header.getByText("성준", { exact: true })).toBeVisible();
  await expect(header.getByText("견습 모험가")).toBeVisible();
  await expect(header.getByLabel("레벨 1")).toBeVisible();
  await expect(page.getByText("퀘스트 게시판이 비어 있어")).toBeVisible();

  // Onboarding is one-time: revisiting bounces back to the adventure.
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/adventure/);

  await page.goto("/settings");
  await page.getByRole("button", { name: "로그아웃" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/adventure");
  await expect(page).toHaveURL(/\/login\?next=%2Fadventure/);
});

test("rejects a wrong code without leaving the code step", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("이메일").fill("wrong-code@example.com");
  await page.getByRole("button", { name: "입장 코드 받기" }).click();
  await page.getByLabel("입장 코드").fill("000000");
  await page.getByRole("button", { name: "모험 입장" }).click();
  await expect(page.getByText("코드가 맞지 않거나 만료됐어요")).toBeVisible();
});

test("signed-in players skip the login page", async ({ page }) => {
  await signIn(page);
  await page.goto("/login");
  await expect(page).toHaveURL(/\/(adventure|onboarding)/);
});
