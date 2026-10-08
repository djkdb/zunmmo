import { expect, test } from "@playwright/test";

import { addQuest, startNewGame, visible } from "./helpers";

test("start today's adventure and clear it", async ({ page }) => {
  await startNewGame(page);
  await addQuest(page, { title: "친구와 저녁 먹기", type: "SIDE" });
  await addQuest(page, {
    title: "영단어 30개",
    type: "DAILY",
    extra: async () => {
      await visible(page).getByRole("radio", { name: "매일" }).click();
    },
  });

  await page.goto("/adventure");
  const panel = visible(page).getByRole("region", { name: "TODAY'S ADVENTURE" });
  await expect(panel).toContainText("추천 퀘스트 2개");
  await panel.getByRole("button", { name: "START TODAY'S ADVENTURE" }).click();

  // Started: a numbered checklist with live progress.
  await expect(panel.getByRole("list")).toBeVisible();
  await expect(panel).toContainText("0/2 완료");
  await panel.getByRole("button", { name: "퀘스트 완료: 영단어 30개" }).click();
  await expect(panel).toContainText("1/2 완료");
  await panel.getByRole("button", { name: "퀘스트 완료: 친구와 저녁 먹기" }).click();

  await expect(panel).toContainText("오늘의 모험 완료!");
  await expect(panel.getByRole("button", { name: "더 모험하기" })).toHaveCount(0);
});
