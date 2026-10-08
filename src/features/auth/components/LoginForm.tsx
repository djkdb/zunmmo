"use client";

import { useActionState, useState } from "react";

import { PixelButton } from "@/components/pixel/PixelButton";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

import {
  type RequestCodeState,
  type VerifyCodeState,
  requestCode,
  signInWithGoogle,
  verifyCode,
} from "../actions";

interface LoginFormProps {
  next: string;
  googleEnabled: boolean;
  initialError?: string;
}

/** Email → 6-digit code. The same email also carries a magic link (see supabase/templates). */
export function LoginForm({ next, googleEnabled, initialError }: LoginFormProps) {
  const [sendState, sendAction, sending] = useActionState<RequestCodeState, FormData>(
    requestCode,
    null,
  );
  const [verifyState, verifyAction, verifying] = useActionState<VerifyCodeState, FormData>(
    verifyCode,
    null,
  );
  const [editingEmail, setEditingEmail] = useState(false);

  const sentTo = sendState?.ok && !editingEmail ? sendState.data.email : null;

  if (sentTo) {
    const error = verifyState && !verifyState.ok ? verifyState.error : null;
    return (
      <div className="flex flex-col gap-6">
        <p role="status" className="text-body text-text-secondary">
          <strong className="text-text">{sentTo}</strong>로 입장 코드를 보냈어요. 메일의 6자리
          코드를 입력하거나 버튼을 눌러 주세요.
        </p>
        <form action={verifyAction} className="flex flex-col gap-5">
          <input type="hidden" name="email" value={sentTo} />
          <input type="hidden" name="next" value={next} />
          <TextField
            label="입장 코드"
            name="token"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            autoFocus
            placeholder="123456"
            error={error ? (error.fields?.token ?? error.message) : undefined}
          />
          <PixelButton type="submit" variant="accent" size="lg" block loading={verifying}>
            모험 입장
          </PixelButton>
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <form action={sendAction}>
            <input type="hidden" name="email" value={sentTo} />
            <Button type="submit" variant="link" disabled={sending}>
              코드 다시 받기
            </Button>
          </form>
          <Button variant="link" onClick={() => setEditingEmail(true)}>
            다른 이메일 쓰기
          </Button>
        </div>
      </div>
    );
  }

  const error = sendState && !sendState.ok ? sendState.error : null;
  return (
    <div className="flex flex-col gap-6">
      <form
        action={(formData) => {
          setEditingEmail(false);
          sendAction(formData);
        }}
        className="flex flex-col gap-5"
      >
        <TextField
          label="이메일"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          hint="비밀번호 없이, 메일로 받은 코드로 입장해요. 처음이면 바로 가입돼요."
          error={error ? (error.fields?.email ?? error.message) : initialError}
        />
        <PixelButton type="submit" variant="accent" size="lg" block loading={sending}>
          입장 코드 받기
        </PixelButton>
      </form>
      {googleEnabled && (
        <form action={signInWithGoogle}>
          <input type="hidden" name="next" value={next} />
          <Button type="submit" className="w-full">
            Google로 계속하기
          </Button>
        </form>
      )}
    </div>
  );
}
