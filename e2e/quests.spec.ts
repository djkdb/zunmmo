import { expect, test } from "@playwright/test";

import { addQuest, startNewGame, visible } from "./helpers";

test("create every quest type and see them on the adventure board", async ({ page }) => {
  await startNewGame(page);

  await addQuest(page, { title: "토요일 축구하기", type: "SIDE" });

  await addQuest(page, {
    title: "컴퓨터네트워크 과제 제출",
    type: "BOSS",
    extra: async () => {
      await visible(page).getByRole("button", { name: "내일" }).click();
      await visible(page).getByLabel("난이도 5").check({ force: true });
    },
  });

  await addQuest(page, {
    title: "운동 30분",
    type: "DAILY",
    extra: async () => {
      await visible(page).getByRole("radio", { name: "매일" }).click();
    },
  });

  await addQuest(page, {
    title: "랜딩 페이지 배포하기",
    type: "MAIN",
    extra: async () => {
      await visible(page).getByLabel("새 퀘스트라인 이름").fill("나만의 웹서비스 출시하기");
    },
  });

  // A boss without a deadline is rejected with a field message.
  await page.goto("/quests/new");
  await visible(page).getByLabel("퀘스트 이름").fill("마감 없는 보스");
  await visible(page).getByLabel("보스 퀘스트").check({ force: true });
  await visible(page).getByRole("button", { name: "게시판에 올리기" }).click();
  await expect(visible(page).getByText("보스 퀘스트에는 마감일이 필요해요.")).toBeVisible();
  // React resets uncontrolled fields after an action; the typed title must survive the error.
  await expect(visible(page).getByLabel("퀘스트 이름")).toHaveValue("마감 없는 보스");

  await page.goto("/adventure");
  const board = visible(page);
  const boss = board.getByRole("region", { name: "다가오는 보스" });
  await expect(boss).toContainText("컴퓨터네트워크 과제 제출");
  await expect(boss).toContainText("D-1");
  await expect(boss).toContainText("+500 XP");
  await expect(board.getByText("나만의 웹서비스 출시하기")).toBeVisible();
  await expect(board.getByRole("link", { name: "랜딩 페이지 배포하기" })).toBeVisible();
  await expect(board.getByRole("link", { name: "운동 30분" })).toBeVisible();
  await expect(board.getByRole("link", { name: "토요일 축구하기" })).toBeVisible();

  // Filters on the quest board
  await page.goto("/quests?type=daily");
  await expect(visible(page).getByRole("link", { name: "운동 30분" })).toBeVisible();
  await expect(visible(page).getByRole("link", { name: "토요일 축구하기" })).toHaveCount(0);
});

test("edit, archive and restore a quest", async ({ page }) => {
  await startNewGame(page);
  await addQuest(page, { title: "영화 보기", type: "SIDE" });

  await visible(page).getByRole("link", { name: "영화 보기" }).click();
  await expect(page).toHaveURL(/\/quests\/[0-9a-f-]+$/);
  await visible(page).getByText("수정하기").click();
  await visible(page).getByLabel("퀘스트 이름").fill("영화 〈듄〉 보기");
  await visible(page).getByLabel("난이도 3").check({ force: true });
  await visible(page).getByRole("button", { name: "저장" }).click();
  await expect(page).toHaveURL(/saved=1/);
  await expect(visible(page).getByText("영화 〈듄〉 보기")).toBeVisible();
  await expect(visible(page).getByText("+70 XP")).toBeVisible();

  await visible(page).getByRole("button", { name: "보관함으로 옮기기" }).click();
  await expect(page).toHaveURL(/\/quests\?archived=1/);
  await expect(visible(page).getByRole("link", { name: "영화 〈듄〉 보기" })).toHaveCount(0);

  await page.goto("/quests?type=archived");
  await visible(page).getByRole("link", { name: "영화 〈듄〉 보기" }).click();
  await visible(page).getByRole("button", { name: "보관함에서 꺼내기" }).click();
  // Wait for the action to land before leaving the page.
  await expect(visible(page).getByRole("button", { name: "보관함으로 옮기기" })).toBeVisible();
  await page.goto("/quests");
  await expect(visible(page).getByRole("link", { name: "영화 〈듄〉 보기" })).toBeVisible();
});
