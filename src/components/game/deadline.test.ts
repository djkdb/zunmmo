import { describe, expect, it } from "vitest";

import { deadlineStatus } from "./deadline";

describe("deadlineStatus", () => {
  const today = "2026-10-08";

  it.each([
    ["2026-10-08", "D-day", "danger"],
    ["2026-10-09", "D-1", "warning"],
    ["2026-10-11", "D-3", "warning"],
    ["2026-10-12", "D-4", "muted"],
    ["2026-10-07", "기한 만료", "muted"],
  ])("%s → %s (%s)", (deadline, label, tone) => {
    expect(deadlineStatus(deadline, today)).toMatchObject({ label, tone });
  });
});
