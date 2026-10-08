import { expect, test } from "@playwright/test";

import { startNewGame, visible } from "./helpers";

test("edit the character and play preferences", async ({ page }) => {
  await startNewGame(page);
  await page.goto("/settings");
  const main = visible(page);

  await main.getByLabel("캐릭터 이름").fill("새벽의 성준");
  await page.getByText("엠버", { exact: true }).filter({ visible: true }).click();
  await main.getByRole("button", { name: "캐릭터 저장" }).click();
  await expect(main.getByText("캐릭터를 저장했어요.")).toBeVisible();
  await expect(main.getByLabel("캐릭터 이름")).toHaveValue("새벽의 성준");

  await main.getByLabel("시간대").selectOption("America/New_York");
  await main.getByLabel("하루가 시작되는 시각").selectOption("6");
  await main.getByLabel("하루 모험 시간").selectOption("120");
  await main.getByRole("button", { name: "플레이 설정 저장" }).click();
  await expect(main.getByText("플레이 설정을 저장했어요.")).toBeVisible();
  await expect(main.getByLabel("시간대")).toHaveValue("America/New_York");
  await expect(main.getByLabel("하루 모험 시간")).toHaveValue("120");

  await page.goto("/adventure");
  await expect(page.locator("main header").filter({ visible: true })).toContainText("새벽의 성준");
});

test("delete the account behind a typed confirmation", async ({ page }) => {
  const email = await startNewGame(page);
  await page.goto("/settings");
  await visible(page).getByRole("button", { name: "계정 삭제" }).click();

  const dialog = page.getByRole("dialog", { name: "계정을 삭제할까요?" });
  await dialog.getByRole("button", { name: "영구 삭제" }).click();
  await expect(dialog.getByText('확인을 위해 "삭제"를 입력해 주세요.')).toBeVisible();
  await dialog.getByLabel(/확인을 위해/).fill("삭제");
  await dialog.getByRole("button", { name: "영구 삭제" }).click();

  await expect(page).toHaveURL(/\/\?farewell=1/);
  await expect(page.getByRole("status")).toContainText("계정과 모든 기록을 지웠어요.");
  await page.goto("/adventure");
  await expect(page).toHaveURL(/\/login/);

  // Signing in again with the same email starts a brand-new game.
  await page.getByLabel("이메일").fill(email);
  await page.getByRole("button", { name: "입장 코드 받기" }).click();
  await expect(page.getByRole("status").filter({ hasText: email })).toBeVisible();
});

test("public pages: legal texts, 404 and the web manifest", async ({ page, request }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { level: 1, name: "개인정보처리방침" })).toBeVisible();
  await page.goto("/terms");
  await expect(page.getByRole("heading", { level: 1, name: "이용약관" })).toBeVisible();

  const missing = await page.goto("/no-such-dungeon");
  expect(missing?.status()).toBe(404);
  await expect(page.getByText("이 길은 지도에 없어.")).toBeVisible();

  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest).toMatchObject({
    name: "LIFE RPG",
    start_url: "/adventure",
    display: "standalone",
  });
  for (const icon of manifest.icons as Array<{ src: string }>) {
    expect((await request.get(icon.src)).status()).toBe(200);
  }
});
