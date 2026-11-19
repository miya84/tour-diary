import { describe, expect, it } from "vitest";

import { mustChangePassword } from "./password-reset-flag";

describe("mustChangePassword", () => {
  it("app_metadata에 표시가 있을 때만 true (AC3, AC7)", () => {
    expect(mustChangePassword({ app_metadata: { must_change_password: true } })).toBe(true);
    expect(mustChangePassword({ app_metadata: { must_change_password: false } })).toBe(false);
    expect(mustChangePassword({ app_metadata: { provider: "email" } })).toBe(false);
    expect(mustChangePassword({})).toBe(false);
    expect(mustChangePassword(null)).toBe(false);
  });
});
