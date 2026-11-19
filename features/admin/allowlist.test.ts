import { describe, expect, it } from "vitest";

import { normalizeEmail, validateAllowlistEmail } from "./allowlist";

describe("normalizeEmail", () => {
  it("앞뒤 공백을 지우고 소문자로 바꾼다 (AC3)", () => {
    expect(normalizeEmail("  Friend@Example.COM ")).toBe("friend@example.com");
  });
});

describe("validateAllowlistEmail", () => {
  it("이메일 형식이면 통과 (AC4)", () => {
    expect(validateAllowlistEmail("friend@example.com", [])).toBeNull();
  });

  it("비었거나 형식이 아니면 이유를 돌려준다 (AC4)", () => {
    expect(validateAllowlistEmail("   ", [])).toBe("이메일을 입력해 주세요.");
    for (const v of ["friend", "friend@", "@example.com", "a b@example.com", "friend@example"]) {
      expect(validateAllowlistEmail(v, [])).toBe("이메일 형식이 아닙니다.");
    }
  });

  it("대소문자만 다른 이메일도 이미 있는 것으로 본다 (AC3, AC4)", () => {
    expect(validateAllowlistEmail("Friend@Example.com", ["friend@example.com"])).toBe("이미 목록에 있는 이메일입니다.");
  });
});
