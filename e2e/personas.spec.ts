import { mkdirSync, writeFileSync } from "node:fs";

import { type Page, expect, test } from "@playwright/test";

import { startNewGame, visible } from "./helpers";
import { buildWorld, zoneAtLocalHour } from "./world";

/**
 * Persona simulations (docs/PERSONAS.md). Each journey plays a real day in the app and
 * asserts the fix its persona drove; screenshots and the visible text at each step land in
 * test-results/personas/<id>/ for review. The player's clock is pinned with an Etc/GMT zone
 * so "late night" and "daytime" do not depend on when the suite runs.
 */
const DAYTIME = () => zoneAtLocalHour(10);

function journal(page: Page, id: string) {
  const dir = `test-results/personas/${id}`;
  mkdirSync(dir, { recursive: true });
  let step = 0;
  const lines: string[] = [];
  return {
    async capture(label: string) {
      step += 1;
      await page.waitForLoadState("networkidle");
      await expect(page.locator("main").filter({ visible: true }).first()).toBeVisible();
      await expect(page.locator(".pixel-skeleton:visible")).toHaveCount(0);
      const name = `${String(step).padStart(2, "0")}-${label}`;
      await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
      const text = await page.locator("main").filter({ visible: true }).first().innerText();
      lines.push(`## ${name}\n${page.url()}\n\n${text.trim()}\n`);
      writeFileSync(`${dir}/journal.md`, lines.join("\n"));
    },
    note(text: string) {
      lines.push(`> ${text}\n`);
      writeFileSync(`${dir}/journal.md`, lines.join("\n"));
    },
  };
}

const adventurePanel = (page: Page) =>
  visible(page).getByRole("region", { name: "TODAY'S ADVENTURE" });

test.describe("mobile personas", () => {
  test.skip(({ isMobile }) => !isMobile, "phone-first personas");

  test("P1 지민 — late-night student before midterms", async ({ page }) => {
    const j = journal(page, "p1-jimin");
    const email = await startNewGame(page, "지민", "바이올렛");
    await buildWorld(email, {
      profile: { timezone: zoneAtLocalHour(1) },
      quests: [
        {
          title: "자료구조 1–4장 정리",
          type: "main",
          difficulty: 3,
          stat: "int",
          goal: "중간고사 대비",
          minutes: 90,
        },
        {
          title: "기출 2년치 풀기",
          type: "main",
          difficulty: 4,
          stat: "int",
          goal: "중간고사 대비",
          minutes: 120,
        },
        {
          title: "오답 노트 만들기",
          type: "main",
          difficulty: 2,
          stat: "int",
          goal: "중간고사 대비",
          minutes: 40,
        },
        {
          title: "자료구조 중간고사",
          type: "boss",
          difficulty: 5,
          stat: "int",
          goal: "중간고사 대비",
          deadlineInDays: 3,
        },
        {
          title: "운영체제 과제 제출",
          type: "side",
          difficulty: 3,
          stat: "foc",
          deadlineInDays: 1,
          minutes: 60,
        },
        {
          title: "영단어 30개",
          type: "daily",
          difficulty: 1,
          stat: "int",
          repeat: { freq: "daily" },
          minutes: 15,
        },
        { title: "동아리 회의록 공유", type: "side", difficulty: 1, stat: "soc" },
      ],
      history: [
        { title: "영단어 30개", daysAgo: 3 },
        { title: "영단어 30개", daysAgo: 2 },
        { title: "영단어 30개", daysAgo: 1 },
      ],
    });
    j.note("01:00 local, nothing completed yet today; boss D-3 inside a questline");
    await page.goto("/adventure");
    await j.capture("dashboard-1am");
    const panel = adventurePanel(page);
    // Night: the GM's words and the plan agree — a light plan, not 3.5 hours.
    await expect(panel).toContainText("늦은 밤이야");
    // Due-tomorrow homework fills tonight's hour; the 90-minute chapter waits for daylight.
    await expect(panel).toContainText("추천 퀘스트 1개");
    await expect(panel).toContainText("운영체제 과제 제출");
    await expect(panel).toContainText("오늘은 가볍게 1시간 안쪽으로만");
    // Three late nights this week: the GM suggests moving the day start instead of nagging.
    await expect(panel).toContainText("새벽에 자주 모험하네요");
    await expect(panel.getByRole("link", { name: "하루 시작 시각" })).toHaveAttribute(
      "href",
      "/settings",
    );
    // The exam is prepared for, not "done" three days early.
    await expect(panel).not.toContainText("자료구조 중간고사");
    // Boss HP: readiness from the questline's prep steps.
    await expect(visible(page).getByRole("progressbar", { name: "보스 준비도" })).toBeVisible();

    const started = Date.now();
    await panel.getByRole("button", { name: "START TODAY'S ADVENTURE" }).click();
    await expect(panel.getByRole("list", { name: "오늘의 모험 퀘스트" })).toBeVisible();
    j.note(`START → checklist: ${Date.now() - started} ms`);
    await j.capture("adventure-started");

    // Still cramming? The player decides: one more quest for tonight.
    await panel.getByText(/퀘스트 더 담기/).click();
    await panel.getByRole("button", { name: "오늘의 모험에 담기: 오답 노트 만들기" }).click();
    await expect(panel.getByRole("link", { name: "오답 노트 만들기" })).toBeVisible();
    await expect(panel).toContainText("0/2 완료");
    await j.capture("added-a-quest");
  });

  test("P2 현우 — busy developer, 90 minutes a day", async ({ page }) => {
    const j = journal(page, "p2-hyunwoo");
    const email = await startNewGame(page, "현우", "로열 블루");
    await buildWorld(email, {
      profile: { timezone: DAYTIME(), capacity: 90 },
      quests: [
        {
          title: "결제 모듈 붙이기",
          type: "main",
          difficulty: 4,
          stat: "foc",
          goal: "사이드 프로젝트 출시",
          minutes: 120,
        },
        {
          title: "랜딩 페이지 카피 쓰기",
          type: "main",
          difficulty: 2,
          stat: "cre",
          goal: "사이드 프로젝트 출시",
          minutes: 40,
        },
        {
          title: "헬스장 가기",
          type: "daily",
          difficulty: 3,
          stat: "vit",
          repeat: { freq: "weekly_count", timesPerWeek: 3 },
          minutes: 70,
        },
        { title: "기술 블로그 글 하나", type: "side", difficulty: 3, stat: "cre", minutes: 90 },
        { title: "치과 예약", type: "side", difficulty: 1, stat: "vit", minutes: 5 },
        {
          title: "책 20쪽 읽기",
          type: "daily",
          difficulty: 1,
          stat: "int",
          repeat: { freq: "daily" },
          minutes: 20,
        },
      ],
    });
    j.note("Morning on the subway: today's plan in 30 seconds, and no gym today");
    await page.goto("/adventure");
    await j.capture("dashboard-morning");
    const panel = adventurePanel(page);
    // A 2-hour step can never fit 90 minutes; the GM says so instead of hiding it.
    await expect(panel).toContainText("결제 모듈 붙이기(2시간)는 오늘 시간에 안 들어가요");
    await expect(panel.getByRole("link", { name: "단계로 나누기" })).toHaveAttribute(
      "href",
      /\/quests\/[0-9a-f-]+\?split=open#split/,
    );
    await panel.getByRole("button", { name: "START TODAY'S ADVENTURE" }).click();
    await expect(panel.getByRole("list", { name: "오늘의 모험 퀘스트" })).toBeVisible();
    await j.capture("adventure-started");

    // The plan stays the player's: drop the gym, add the 5-minute errand.
    await panel.getByRole("button", { name: "오늘의 모험에서 빼기: 헬스장 가기" }).click();
    await expect(panel.getByRole("link", { name: "헬스장 가기" })).toHaveCount(0);
    await expect(panel.getByRole("heading", { name: "TODAY'S ADVENTURE" })).toBeFocused();
    await panel.getByText(/퀘스트 더 담기/).click();
    await panel.getByRole("button", { name: "오늘의 모험에 담기: 치과 예약" }).click();
    await expect(panel.getByRole("link", { name: "치과 예약" })).toBeVisible();
    await j.capture("plan-edited");
    // Asking for a new plan does not bring back what they just took out.
    await panel.getByRole("button", { name: "다시 추천받기" }).click();
    await expect(panel.getByRole("list", { name: "오늘의 모험 퀘스트" })).toBeVisible();
    await expect(panel.getByRole("link", { name: "책 20쪽 읽기" })).toBeVisible();
    await expect(panel.getByRole("link", { name: "헬스장 가기" })).toHaveCount(0);

    // The 2-hour step becomes three steps the day can hold (GAME_MASTER §7).
    await page.goto("/quests");
    await visible(page).getByRole("link", { name: "결제 모듈 붙이기" }).click();
    await visible(page).getByText("단계로 나누기").click();
    await visible(page)
      .getByLabel("한 줄에 한 단계 (2–6줄)")
      .fill("결제 API 조사하기\n결제 화면 만들기\n결제 테스트하기");
    await expect(visible(page).getByText("합계 +120 XP (원래 +120 XP)")).toBeVisible();
    await visible(page).getByRole("button", { name: "3단계로 나누기" }).click();
    await expect(visible(page).getByText("3단계로 나눴어요.")).toBeVisible();
    await j.capture("split-quest");
    await page.goto("/adventure");
    await expect(visible(page).getByText(/다음:\s*결제 API 조사하기/)).toBeVisible();
  });

  test("P3 소연 — back after three weeks away", async ({ page }) => {
    const j = journal(page, "p3-soyeon");
    const email = await startNewGame(page, "소연", "에메랄드");
    await buildWorld(email, {
      profile: { timezone: DAYTIME() },
      quests: [
        {
          title: "이력서 업데이트",
          type: "side",
          difficulty: 2,
          stat: "foc",
          deadlineInDays: -18,
          createdDaysAgo: 30,
        },
        {
          title: "포트폴리오 사이트 정리",
          type: "side",
          difficulty: 3,
          stat: "cre",
          deadlineInDays: -10,
          createdDaysAgo: 30,
        },
        {
          title: "자격증 원서 접수",
          type: "boss",
          difficulty: 3,
          stat: "foc",
          deadlineInDays: -5,
          createdDaysAgo: 30,
        },
        {
          title: "요가 20분",
          type: "daily",
          difficulty: 2,
          stat: "vit",
          repeat: { freq: "daily" },
          minutes: 20,
          createdDaysAgo: 30,
        },
        {
          title: "아이와 산책",
          type: "daily",
          difficulty: 1,
          stat: "soc",
          repeat: { freq: "daily" },
          minutes: 30,
          createdDaysAgo: 30,
        },
      ],
      history: [
        { title: "요가 20분", daysAgo: 24 },
        { title: "아이와 산책", daysAgo: 24 },
        { title: "요가 20분", daysAgo: 23 },
        { title: "요가 20분", daysAgo: 22 },
      ],
    });
    j.note("Last played 22 days ago, three expired one-off quests, broken streak");
    await page.goto("/adventure");
    await j.capture("dashboard-return");
    const panel = adventurePanel(page);
    // Comeback: a warm-up, and a missed exam date is not today's top quest.
    await expect(panel).toContainText("추천 퀘스트 2개");
    await expect(panel).not.toContainText("자격증 원서 접수");

    const expired = visible(page).getByRole("region", { name: "EXPIRED" });
    await expect(expired).toContainText("기한이 지나도 얻은 XP는 그대로야");
    await expired.getByRole("button", { name: "다시 도전: 이력서 업데이트" }).click();
    await expect(visible(page).getByText(/이력서 업데이트 — .*까지 다시 도전!/)).toBeVisible();
    await expect(expired.getByText("이력서 업데이트")).toHaveCount(0);
    await expired.getByRole("button", { name: "보관: 포트폴리오 사이트 정리" }).click();
    await expect(expired.getByText("포트폴리오 사이트 정리")).toHaveCount(0);
    await j.capture("after-cleanup");

    await page.goto("/quests");
    await expect(visible(page).getByRole("link", { name: "이력서 업데이트" })).toBeVisible();
    await j.capture("quest-board");
  });
});

test.describe("desktop personas", () => {
  test.skip(({ isMobile }) => isMobile, "desktop-first personas");

  test("P4 태오 — freelancer with a packed calendar", async ({ page }) => {
    const j = journal(page, "p4-taeo");
    const email = await startNewGame(page, "태오", "엠버");
    await buildWorld(email, {
      // Abroad on a client's clock; pinned to 10:00 local so today is a working day.
      profile: { timezone: DAYTIME(), capacity: 240 },
      quests: [
        {
          title: "클라이언트 A 시안 2종",
          type: "boss",
          difficulty: 4,
          stat: "cre",
          deadlineInDays: 1,
          minutes: 180,
        },
        { title: "견적서 보내기", type: "side", difficulty: 1, stat: "foc", minutes: 15 },
        {
          title: "아이콘 세트 마감",
          type: "side",
          difficulty: 3,
          stat: "cre",
          deadlineInDays: 4,
          minutes: 120,
        },
        {
          title: "크로키 15분",
          type: "daily",
          difficulty: 1,
          stat: "cre",
          repeat: { freq: "daily" },
          minutes: 15,
        },
      ],
      schedules: [
        { title: "A사 킥오프 콜", dayOffset: 0, start: "09:00", end: "10:00" },
        { title: "B사 리뷰", dayOffset: 0, start: "11:00", end: "12:30" },
        { title: "점심 미팅", dayOffset: 0, start: "12:30", end: "13:30" },
        { title: "C사 주간 싱크", dayOffset: 0, start: "16:00", end: "17:00" },
        { title: "A사 피드백 콜", dayOffset: 1, start: "10:00", end: "11:00" },
        {
          title: "데일리 스탠드업",
          dayOffset: -3,
          start: "08:45",
          end: "09:00",
          weekdays: [1, 2, 3, 4, 5, 6, 7],
        },
      ],
    });
    j.note("4.5h of meetings today against a 4h capacity; boss due tomorrow (180 min)");
    await page.goto("/adventure");
    await j.capture("dashboard");
    const panel = adventurePanel(page);
    await expect(panel).toContainText("오늘 일정 5개(4시간 45분)를 빼고");
    // The boss is due tomorrow, and the 15-minute quests still fit between meetings.
    await expect(panel).toContainText("클라이언트 A 시안 2종");
    await expect(panel).toContainText("견적서 보내기");
    await expect(panel).toContainText("크로키 15분");

    await page.goto("/calendar");
    await j.capture("calendar-week");
    await visible(page).getByRole("button", { name: "퀘스트 완료: 크로키 15분" }).click();
    await expect(visible(page).getByText("크로키 15분 완료 +20 XP")).toBeVisible();
    await j.capture("completed-from-calendar");
    // A daily standup is one weekly series: it shows as such and edits from the agenda.
    await expect(visible(page).getByRole("region", { name: /오늘/ })).toContainText("매일");
    await visible(page).getByRole("link", { name: "데일리 스탠드업" }).click();
    await expect(visible(page).getByText(/매일 반복 일정이에요/)).toBeVisible();

    // The A사 call ran long: move only today's standup, then put it back.
    await visible(page)
      .getByRole("link", { name: /회차만$/ })
      .click();
    await expect(page).toHaveURL(/scope=one/);
    await expect(visible(page).getByText(/회차만 바꿔요/)).toBeVisible();
    await visible(page).getByLabel("시작").fill("10:15");
    await visible(page).getByLabel("끝 (선택)").fill("10:30");
    await visible(page).getByRole("button", { name: "이번 회차 저장" }).click();
    await expect(page).toHaveURL(/saved=1/);
    const today = visible(page).getByRole("region", { name: /오늘/ });
    await expect(today).toContainText("이번 회차만 변경");
    await expect(today).toContainText("10:15");
    await expect(today).not.toContainText("08:45");
    await j.capture("standup-moved");
    // Next week keeps the usual time.
    await visible(page).getByRole("link", { name: "다음 주" }).click();
    await expect(visible(page).getByRole("region", { name: /^\d+월 \d+일 \(.\)$/ })).toContainText(
      "08:45",
    );

    await page.goto("/calendar");
    await visible(page).getByRole("link", { name: "데일리 스탠드업" }).click();
    await expect(visible(page).getByText(/회차만 바꾼 일정이에요/)).toBeVisible();
    await visible(page).getByRole("button", { name: "원래 일정으로 되돌리기" }).click();
    await expect(visible(page).getByText("원래 일정으로 되돌렸어요.")).toBeVisible();
    await expect(visible(page).getByRole("region", { name: /오늘/ })).toContainText("08:45");
  });

  test("P5 하늘 — keyboard and screen reader, eight daily routines", async ({ browser }) => {
    const context = await browser.newContext({
      reducedMotion: "reduce",
      locale: "ko-KR",
      timezoneId: "Asia/Seoul",
      viewport: { width: 1280, height: 900 },
    });
    const page = await context.newPage();
    const j = journal(page, "p5-haneul");
    const email = await startNewGame(page, "하늘", "로열 블루");
    const daily = (
      title: string,
      minutes: number,
      stat: "vit" | "int" | "soc" | "cre" = "vit",
    ) => ({
      title,
      type: "daily" as const,
      difficulty: 1 as const,
      stat,
      repeat: { freq: "daily" },
      minutes,
    });
    await buildWorld(email, {
      profile: { timezone: DAYTIME() },
      quests: [
        daily("아침 약 먹기", 5),
        daily("물 2L 마시기", 5),
        daily("스트레칭 10분", 10),
        daily("산책 20분", 20),
        daily("점자 책 읽기", 30, "int"),
        daily("가족과 통화", 10, "soc"),
        daily("저녁 약 먹기", 5),
        daily("하루 일기", 10, "cre"),
      ],
    });
    await page.goto("/adventure");
    await j.capture("dashboard");
    // Routines read in the order they were made.
    const dailies = visible(page).getByRole("region", { name: "DAILY" });
    await expect(dailies.getByRole("listitem").first()).toContainText("아침 약 먹기");
    await expect(dailies.getByRole("listitem").last()).toContainText("하루 일기");

    // Keyboard only: Tab to the first routine's check and press Enter.
    const target = dailies.getByRole("button", { name: "퀘스트 완료: 아침 약 먹기" });
    let tabs = 0;
    for (; tabs < 80; tabs++) {
      await page.keyboard.press("Tab");
      if (await target.evaluate((el) => el === document.activeElement).catch(() => false)) break;
    }
    j.note(`Tab presses to reach the first routine's check: ${tabs + 1}`);
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "되돌리기" })).toBeVisible();
    // Focus stays on the check, which now offers the undo — no hunting for the toast.
    await expect(dailies.getByRole("button", { name: "완료 취소: 아침 약 먹기" })).toBeFocused();
    // The undo toast outlives the old 5 seconds.
    await page.waitForTimeout(6_000);
    await expect(page.getByRole("button", { name: "되돌리기" })).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(dailies.getByRole("button", { name: "퀘스트 완료: 아침 약 먹기" })).toBeFocused();
    await j.capture("after-undo");
    await context.close();
  });
});
