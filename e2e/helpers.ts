import { randomUUID } from "node:crypto";

import { type Page, expect } from "@playwright/test";

const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

export function uniqueEmail(): string {
  return `e2e-${randomUUID().slice(0, 8)}@example.com`;
}

/** Poll Mailpit for the newest sign-in email to `email` and return its 6-digit code. */
export async function readSignInCode(email: string): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
    const { messages } = (await res.json()) as { messages: Array<{ ID: string }> };
    if (messages.length) {
      const message = (await (
        await fetch(`${MAILPIT}/api/v1/message/${messages[0]!.ID}`)
      ).json()) as { HTML: string; Text: string };
      const code = (message.Text || message.HTML).match(/\b(\d{6})\b/)?.[1];
      if (code) return code;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No sign-in email for ${email}`);
}

/** Sign in with a fresh account (or `email`) through the real OTP flow. */
export async function signIn(
  page: Page,
  email = uniqueEmail(),
  next = "/adventure",
): Promise<string> {
  await page.goto(next);
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.getByLabel("이메일").fill(email);
  await page.getByRole("button", { name: "입장 코드 받기" }).click();
  await expect(page.getByRole("status").filter({ hasText: email })).toBeVisible();
  const code = await readSignInCode(email);
  await page.getByLabel("입장 코드").fill(code);
  await page.getByRole("button", { name: "모험 입장" }).click();
  await expect(page).not.toHaveURL(/\/login/);
  return email;
}

/** Fresh account through onboarding, ending on /adventure. */
export async function startNewGame(
  page: Page,
  name = "성준",
  outfit = "에메랄드",
): Promise<string> {
  const email = await signIn(page);
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByLabel("캐릭터 이름").fill(name);
  await page.getByText(outfit, { exact: true }).click();
  await page.getByRole("button", { name: "모험 시작" }).click();
  await expect(page).toHaveURL(/\/adventure/);
  await expect(page.locator("main header").filter({ visible: true })).toBeVisible();
  return email;
}
