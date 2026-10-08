/**
 * Application error codes → user-facing Korean copy, in one place (CLAUDE.md: 오류 문구 매핑은 한 곳).
 * System copy uses 해요체 (UI_GUIDE §11).
 */
export const ERROR_MESSAGES = {
  UNAUTHENTICATED: "로그인이 필요해요.",
  VALIDATION_FAILED: "입력한 내용을 다시 확인해 주세요.",
  NOT_FOUND: "찾을 수 없어요.",
  CHARACTER_EXISTS: "이미 캐릭터가 있어요.",
  QUEST_NOT_FOUND: "퀘스트를 찾을 수 없어요.",
  QUEST_NOT_ACTIVE: "진행 중인 퀘스트가 아니에요.",
  ALREADY_COMPLETED: "이미 완료한 퀘스트예요.",
  UNDO_WINDOW_PASSED: "오늘 완료한 퀘스트만 되돌릴 수 있어요.",
  OTP_SEND_FAILED: "코드를 보내지 못했어요. 잠시 후 다시 시도해 주세요.",
  OTP_INVALID: "코드가 맞지 않거나 만료됐어요. 새 코드를 받아 주세요.",
  RATE_LIMITED: "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.",
  UNKNOWN: "문제가 생겼어요. 잠시 후 다시 시도해 주세요.",
} as const;

export type ErrorCode = keyof typeof ERROR_MESSAGES;

export interface AppError {
  code: ErrorCode;
  message: string;
  /** Per-field messages for forms. */
  fields?: Record<string, string>;
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: AppError };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail(
  code: ErrorCode,
  fields?: Record<string, string>,
): { ok: false; error: AppError } {
  return {
    ok: false,
    error: { code, message: ERROR_MESSAGES[code], ...(fields ? { fields } : {}) },
  };
}

/** Map a Postgres/PostgREST error raised by our RPCs (`raise exception 'CODE'`) to an AppError code. */
export function codeFromDbError(
  error: { message?: string; code?: string } | null | undefined,
): ErrorCode {
  const message = error?.message ?? "";
  const known = (Object.keys(ERROR_MESSAGES) as ErrorCode[]).find((code) => message.includes(code));
  if (known) return known;
  if (error?.code === "23514" || error?.code === "22P02") return "VALIDATION_FAILED";
  if (error?.code === "28000") return "UNAUTHENTICATED";
  return "UNKNOWN";
}

/** Flatten a Zod error into `{ field: firstMessage }`. */
export function fieldErrors(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>,
): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".") || "_";
    fields[key] ??= issue.message;
  }
  return fields;
}

/**
 * State returned by a form action. React 19 resets uncontrolled fields after every action,
 * so failures echo the submitted text back to be used as `defaultValue`.
 */
export type FormState = { ok: false; error: AppError; values?: Record<string, string> } | null;

export function withValues(
  failure: { ok: false; error: AppError },
  formData: FormData,
): NonNullable<FormState> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$")) values[key] = value;
  }
  return { ...failure, values };
}
