"use server";

import { redirect } from "next/navigation";

import { type Result, fail, fieldErrors, ok } from "@/lib/errors";
import { publicEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

import { EmailSchema, OtpSchema, safeNextPath } from "./schemas";

export type RequestCodeState = Result<{ email: string }> | null;

/** Step 1: email → 6-digit code + magic link (one email). Creates the account on first use. */
export async function requestCode(
  _prev: RequestCodeState,
  formData: FormData,
): Promise<RequestCodeState> {
  const parsed = EmailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return fail("VALIDATION_FAILED", fieldErrors(parsed.error.issues));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    },
  });
  if (error) return fail(error.status === 429 ? "RATE_LIMITED" : "OTP_SEND_FAILED");
  return ok({ email: parsed.data.email });
}

export type VerifyCodeState = Result<never> | null;

/** Step 2: verify the code, then continue to `next` (or the adventure). */
export async function verifyCode(
  _prev: VerifyCodeState,
  formData: FormData,
): Promise<VerifyCodeState> {
  const parsed = OtpSchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) return fail("VALIDATION_FAILED", fieldErrors(parsed.error.issues));

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: "email",
  });
  if (error) return fail(error.status === 429 ? "RATE_LIMITED" : "OTP_INVALID");

  redirect(safeNextPath(parsed.data.next));
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const next = safeNextPath(formData.get("next")?.toString());
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
