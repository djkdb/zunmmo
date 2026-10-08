import { expect, test } from "@playwright/test";

import { addQuest, startNewGame, visible } from "./helpers";

test("add a schedule, see it on the calendar, then delete it", async ({ page }) => {
  await startNewGame(page);
  await addQuest(page, {
    title: "보고서 제출",
    type: "BOSS",
    extra: async () => {
      await visible(page).getByRole("button", { name: "내일" }).click();
    },
  });

  await page.goto("/calendar");
  const main = visible(page);
  await expect(main.getByRole("heading", { level: 2 })).toContainText("오늘");
  await main.getByRole("link", { name: "+ 일정" }).click();

  await expect(page).toHaveURL(/\/calendar\/new\?d=/);
  await visible(page).getByLabel("일정 이름").fill("AI 스터디");
  await visible(page).getByLabel("시작").fill("19:00");
  await visible(page).getByLabel("끝 (선택)").fill("18:00");
  await visible(page).getByRole("button", { name: "일정 추가" }).click();
  await expect(visible(page).getByText("끝나는 시간은 시작보다 늦어야 해요.")).toBeVisible();
  await visible(page).getByLabel("끝 (선택)").fill("20:30");
  await visible(page).getByLabel("장소 (선택)").fill("도서관");
  await visible(page).getByRole("button", { name: "일정 추가" }).click();

  await expect(page).toHaveURL(/\/calendar\?d=.*added=1/);
  const agenda = visible(page).getByRole("region", { name: /오늘/ });
  await expect(agenda).toContainText("AI 스터디");
  await expect(agenda).toContainText("19:00");
  await expect(agenda).toContainText("~20:30");
  await expect(agenda).toContainText("도서관");

  // Tomorrow's boss deadline is announced on its cell and listed in its agenda.
  const tomorrow = visible(page).getByRole("link", { name: /마감 1개/ });
  await tomorrow.click();
  await expect(visible(page).getByRole("region", { name: /\d+월 \d+일/ })).toContainText(
    "보고서 제출",
  );

  // Month view keeps the same selection.
  await visible(page).getByRole("link", { name: "월", exact: true }).click();
  await expect(page).toHaveURL(/view=month/);
  await expect(visible(page).getByRole("grid")).toBeVisible();

  await page.goto("/calendar");
  await visible(page).getByRole("button", { name: "일정 삭제: AI 스터디" }).click();
  await expect(visible(page).getByText("AI 스터디")).toHaveCount(0);
});

test("a weekly class repeats, skips one week and edits as a series", async ({ page }) => {
  await startNewGame(page);
  await page.goto("/calendar/new");
  const form = visible(page);
  await form.getByLabel("일정 이름").fill("자료구조 수업");
  await form.getByLabel("시작").fill("10:30");
  await form.getByLabel("끝 (선택)").fill("12:00");
  await form.getByLabel(/매주 반복/).check();
  // Today's weekday is preselected; the class also meets on the following day.
  const tomorrowLabel = await page.evaluate(() => {
    const labels = ["일", "월", "화", "수", "목", "금", "토"];
    return `${labels[(new Date().getDay() + 1) % 7]}요일`;
  });
  await form.getByRole("checkbox", { name: tomorrowLabel }).check({ force: true });
  await form.getByRole("button", { name: "일정 추가" }).click();
  await expect(page).toHaveURL(/added=1/);
  await expect(visible(page).getByRole("region", { name: /오늘/ })).toContainText("자료구조 수업");

  // Next week it is there again, labelled as a weekly series.
  await visible(page).getByRole("link", { name: "다음 주" }).click();
  await expect(page).toHaveURL(/\/calendar\?d=\d{4}-\d{2}-\d{2}$/);
  // Not today's agenda: the heading has no "· 오늘".
  const nextWeek = visible(page).getByRole("region", { name: /^\d+월 \d+일 \(.\)$/ });
  await expect(nextWeek).toContainText("자료구조 수업");
  await expect(nextWeek).toContainText(/매주 /);

  // Skip just that occurrence.
  await nextWeek.getByRole("button", { name: "이번만 건너뛰기: 자료구조 수업" }).click();
  await expect(visible(page).getByText("이번 회차를 건너뛰었어요.")).toBeVisible();
  await expect(page).toHaveURL(/skipped=1/);
  await expect(visible(page).getByRole("region", { name: /\d+월 \d+일/ })).not.toContainText(
    "자료구조 수업",
  );
  await page.goto("/calendar");
  await expect(visible(page).getByRole("region", { name: /오늘/ })).toContainText("자료구조 수업");

  // Editing the series renames every occurrence.
  await page.goto("/calendar");
  await visible(page).getByRole("link", { name: "자료구조 수업" }).click();
  await expect(page).toHaveURL(/\/calendar\/schedules\/[0-9a-f-]+\?d=/);
  await expect(visible(page).getByText(/반복 일정이에요/)).toBeVisible();
  await visible(page).getByLabel("일정 이름").fill("자료구조 강의");
  await visible(page).getByRole("button", { name: "저장" }).click();
  await expect(page).toHaveURL(/saved=1/);
  await expect(visible(page).getByRole("region", { name: /오늘/ })).toContainText("자료구조 강의");
});
