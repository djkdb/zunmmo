import { expect, test } from "@playwright/test";

import { signIn, startNewGame, visible } from "./helpers";

test("onboarding with GM templates reaches the first XP quickly", async ({ page }) => {
  const started = Date.now();
  await signIn(page);
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByLabel("캐릭터 이름").fill("하린");
  await page.getByRole("button", { name: "모험 시작" }).click();

  await expect(page).toHaveURL(/\/onboarding\/quests/);
  await expect(page.getByRole("checkbox", { name: /산책 20분/ })).toBeChecked();
  await page.getByText("방 정리 15분").click();
  await page.getByText("운동 30분").click();
  await page.getByRole("button", { name: "3개로 모험 시작" }).click();

  await expect(page).toHaveURL(/\/adventure/);
  const panel = visible(page).getByRole("region", { name: "TODAY'S ADVENTURE" });
  await expect(panel).toContainText("게임 마스터:");
  await expect(panel).toContainText("추천 퀘스트 3개");
  await panel.getByRole("button", { name: "START TODAY'S ADVENTURE" }).click();
  await panel.getByRole("button", { name: "퀘스트 완료: 산책 20분" }).click();
  await expect(visible(page).getByText("산책 20분 완료 +20 XP")).toBeVisible();

  // GAME_MASTER exit criterion: templates alone get a new player to XP within 3 minutes.
  expect(Date.now() - started).toBeLessThan(180_000);
});

test("a template pre-fills the quick-add form", async ({ page }) => {
  await startNewGame(page);
  await page.goto("/quests/new");
  await visible(page).getByText("GM 템플릿에서 고르기").click();
  await visible(page).getByRole("link", { name: "물 2L 마시기" }).click();
  await expect(page).toHaveURL(/template=health-water/);
  await expect(visible(page).getByLabel("퀘스트 이름")).toHaveValue("물 2L 마시기");
  await expect(visible(page).getByLabel("데일리 퀘스트")).toBeChecked();
  await visible(page).getByRole("button", { name: "게시판에 올리기" }).click();
  await expect(page).toHaveURL(/\/quests\?created=/);
});

test("a new questline can be typed as steps with a final boss", async ({ page }) => {
  await startNewGame(page);
  await page.goto("/quests/new?type=main");
  const form = visible(page);
  await form.getByLabel("퀘스트 이름").fill("기획서 한 장 쓰기");
  await form.getByLabel("새 퀘스트라인 이름").fill("동아리 앱 만들기");
  await form.getByLabel("이어지는 단계 (선택, 한 줄에 하나)").fill("화면 만들기\n출시 발표");
  await form.getByLabel(/마지막 단계를 BOSS로/).check();
  await form.getByRole("button", { name: "게시판에 올리기" }).click();
  await expect(form.getByText("보스 단계에는 마감일이 필요해요.")).toBeVisible();
  await expect(form.getByLabel("이어지는 단계 (선택, 한 줄에 하나)")).toHaveValue(
    "화면 만들기\n출시 발표",
  );

  await form.getByRole("button", { name: "내일" }).click();
  await form.getByRole("button", { name: "게시판에 올리기" }).click();
  await expect(page).toHaveURL(/\/quests\?created=/);

  await page.goto("/adventure");
  const board = visible(page);
  await expect(board.getByRole("region", { name: "다가오는 보스" })).toContainText("출시 발표");
  await expect(board.getByText("동아리 앱 만들기")).toBeVisible();
  await expect(board.getByText(/다음:\s*기획서 한 장 쓰기/)).toBeVisible();
});
