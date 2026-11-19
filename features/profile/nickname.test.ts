import { describe, expect, it } from "vitest";

import { NICKNAME_MAX, validateNickname } from "./nickname";

describe("validateNickname", () => {
  it("앞뒤 공백을 지운 닉네임을 돌려준다", () => {
    expect(validateNickname("  석이  ")).toEqual({ ok: true, nickname: "석이" });
  });

  it("비어 있거나 공백뿐이면 거부한다", () => {
    expect(validateNickname("")).toEqual({ ok: false, error: "닉네임을 입력해 주세요." });
    expect(validateNickname("   ")).toEqual({ ok: false, error: "닉네임을 입력해 주세요." });
  });

  it("최대 길이까지 허용하고 넘으면 거부한다", () => {
    expect(validateNickname("가".repeat(NICKNAME_MAX)).ok).toBe(true);
    expect(validateNickname("가".repeat(NICKNAME_MAX + 1))).toEqual({
      ok: false,
      error: `닉네임은 ${NICKNAME_MAX}자 이하로 입력해 주세요.`,
    });
  });

  it("같은 닉네임을 다른 사람이 써도 허용한다", () => {
    expect(validateNickname("여행자").ok).toBe(true);
  });
});
