import { describe, expect, it } from "vitest";

import { inviteErrorMessage } from "./invite-errors";

describe("inviteErrorMessage", () => {
  it("초대 실패 이유마다 다른 안내를 준다 (AC16)", () => {
    expect(inviteErrorMessage("not_registered")).toBe("가입된 회원이 아닙니다. 가입한 이메일만 초대할 수 있습니다.");
    expect(inviteErrorMessage("already_invited")).toBe("이미 초대해서 수락을 기다리는 중입니다.");
    expect(inviteErrorMessage("already_member")).toBe("이미 이 여행의 멤버입니다.");
    expect(inviteErrorMessage("not_owner")).toBe("초대는 여행을 만든 사람만 할 수 있습니다.");
  });

  it("모르는 오류는 일반 안내를 준다", () => {
    expect(inviteErrorMessage("something else")).toBe("초대하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  });
});
