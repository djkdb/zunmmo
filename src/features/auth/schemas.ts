import { z } from "zod";

export const EmailSchema = z.object({
  email: z.email("이메일 주소를 확인해 주세요.").trim().toLowerCase(),
});

export const OtpSchema = z.object({
  email: z.email().trim().toLowerCase(),
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "6자리 숫자 코드를 입력해 주세요."),
  next: z.string().optional(),
});

/** Only same-origin relative paths — never an open redirect. */
export function safeNextPath(next: string | null | undefined, fallback = "/adventure"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\"))
    return fallback;
  return next;
}
