import { describe, expect, it } from "vitest";

import { codeFromDbError, fail, fieldErrors } from ".";

describe("errors", () => {
  it("maps RPC exception names to codes", () => {
    expect(codeFromDbError({ message: "ALREADY_COMPLETED" })).toBe("ALREADY_COMPLETED");
    expect(codeFromDbError({ message: "new row violates check", code: "23514" })).toBe(
      "VALIDATION_FAILED",
    );
    expect(codeFromDbError({ message: "boom" })).toBe("UNKNOWN");
    expect(codeFromDbError(null)).toBe("UNKNOWN");
  });

  it("builds failures with Korean copy", () => {
    expect(fail("OTP_INVALID")).toEqual({
      ok: false,
      error: {
        code: "OTP_INVALID",
        message: "코드가 맞지 않거나 만료됐어요. 새 코드를 받아 주세요.",
      },
    });
  });

  it("keeps the first message per field", () => {
    expect(
      fieldErrors([
        { path: ["name"], message: "a" },
        { path: ["name"], message: "b" },
        { path: [], message: "c" },
      ]),
    ).toEqual({
      name: "a",
      _: "c",
    });
  });
});
