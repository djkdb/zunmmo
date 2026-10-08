"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { TextField } from "@/components/ui/TextField";

import { deleteAccount } from "../actions";
import { DELETE_CONFIRMATION } from "../schemas";

/** Account deletion behind a typed confirmation — the one irreversible action in the game. */
export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deleteAccount, null);

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        계정 삭제
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="계정을 삭제할까요?"
        description="캐릭터, 퀘스트, XP 기록, 업적, 일정이 모두 즉시 지워지고 되돌릴 수 없어요."
      >
        <form action={action} className="flex flex-col gap-4">
          <TextField
            label={`확인을 위해 "${DELETE_CONFIRMATION}"를 입력해 주세요`}
            name="confirm"
            autoComplete="off"
            error={
              state?.error.fields?.confirm ??
              (state && !state.error.fields ? state.error.message : undefined)
            }
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button type="submit" variant="danger" disabled={pending}>
              {pending ? "삭제 중…" : "영구 삭제"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
