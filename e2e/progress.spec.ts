import { expect, test } from "@playwright/test";

import { addQuest, startNewGame, visible } from "./helpers";
import { setTotalXp } from "./seed";

test("complete a quest, earn XP and a badge, then undo", async ({ page }) => {
  await startNewGame(page);
  await addQuest(page, { title: "토요일 축구하기", type: "SIDE" });

  await page.goto("/adventure");
  const board = visible(page);
  await board.getByRole("button", { name: "퀘스트 완료: 토요일 축구하기" }).click();

  await expect(board.getByText("토요일 축구하기 완료 +40 XP")).toBeVisible();
  await expect(board.getByText("COMMON 업적 해금 — 첫 걸음")).toBeVisible();
  await expect(page.locator("main header").filter({ visible: true })).toContainText("40");

  // Completed side quests leave the board; the quest list still offers undo today.
  await page.goto("/quests");
  await visible(page).getByText("완료한 퀘스트 1개").click();
  const undo = visible(page).getByRole("button", { name: "완료 취소: 토요일 축구하기" });
  await expect(undo).toHaveAttribute("aria-pressed", "true");
  await undo.click();
  await expect(
    visible(page).getByRole("button", { name: "퀘스트 완료: 토요일 축구하기" }),
  ).toBeVisible();
  await expect(visible(page).getByText("완료한 퀘스트 1개")).toHaveCount(0);
});

test("crossing a level boundary opens the level-up scene", async ({ page }) => {
  const email = await startNewGame(page);
  await addQuest(page, {
    title: "운동 30분",
    type: "DAILY",
    extra: async () => {
      await visible(page).getByRole("radio", { name: "매일" }).click();
    },
  });
  await setTotalXp(email, 990);

  await page.goto("/adventure");
  await visible(page).getByRole("button", { name: "퀘스트 완료: 운동 30분" }).click();

  const dialog = page.getByRole("dialog", { name: "LEVEL UP!" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Lv.2");
  await dialog.getByRole("button", { name: "계속 모험하기" }).click();
  await expect(dialog).toBeHidden();

  // The daily stays on the board, checked for today.
  await expect(visible(page).getByRole("button", { name: "완료 취소: 운동 30분" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
