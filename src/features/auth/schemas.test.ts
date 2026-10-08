import { describe, expect, it } from "vitest";

import { OtpSchema, safeNextPath } from "./schemas";

describe("safeNextPath", () => {
  it.each([
    [undefined, "/adventure"],
    ["/quests?type=boss", "/quests?type=boss"],
    ["https://evil.example", "/adventure"],
    ["//evil.example", "/adventure"],
    ["/\\evil.example", "/adventure"],
    ["adventure", "/adventure"],
  ])("%s → %s", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });
});

describe("OtpSchema", () => {
  it("accepts exactly six digits", () => {
    expect(OtpSchema.safeParse({ email: "a@b.co", token: " 123456 " }).success).toBe(true);
    expect(OtpSchema.safeParse({ email: "a@b.co", token: "12345" }).success).toBe(false);
    expect(OtpSchema.safeParse({ email: "a@b.co", token: "12345a" }).success).toBe(false);
  });
});
