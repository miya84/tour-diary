import { describe, expect, it } from "vitest";

import { validateNewPassword, validatePasswordChange } from "./new-password";

describe("validatePasswordChange", () => {
  it("현재 비밀번호가 있고 새 비밀번호 규칙을 지키면 통과 (AC9)", () => {
    expect(validatePasswordChange("oldpass1", "newpass1", "newpass1")).toBeNull();
  });

  it("현재 비밀번호가 비었거나, 새 비밀번호가 현재와 같으면 이유를 돌려준다 (AC9)", () => {
    expect(validatePasswordChange("", "newpass1", "newpass1")).toBe("현재 비밀번호를 입력해 주세요.");
    expect(validatePasswordChange("samepass", "samepass", "samepass")).toBe("현재 비밀번호와 다른 비밀번호를 정해 주세요.");
  });

  it("새 비밀번호 규칙도 그대로 적용한다 (AC9)", () => {
    expect(validatePasswordChange("oldpass1", "abc12", "abc12")).toBe("비밀번호는 6자 이상이어야 합니다.");
    expect(validatePasswordChange("oldpass1", "newpass1", "newpass2")).toBe("비밀번호가 서로 다릅니다.");
  });
});

describe("validateNewPassword", () => {
  it("6자 이상이고 두 칸이 같으면 통과 (AC4)", () => {
    expect(validateNewPassword("newpass1", "newpass1")).toBeNull();
  });

  it("짧거나 다르면 이유를 돌려준다 (AC4)", () => {
    expect(validateNewPassword("abc12", "abc12")).toBe("비밀번호는 6자 이상이어야 합니다.");
    expect(validateNewPassword("newpass1", "newpass2")).toBe("비밀번호가 서로 다릅니다.");
  });
});
