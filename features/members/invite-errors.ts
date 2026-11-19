const MESSAGES: Record<string, string> = {
  not_registered: "가입된 회원이 아닙니다. 가입한 이메일만 초대할 수 있습니다.",
  already_invited: "이미 초대해서 수락을 기다리는 중입니다.",
  already_member: "이미 이 여행의 멤버입니다.",
  not_owner: "초대는 여행을 만든 사람만 할 수 있습니다.",
};

// DB 함수 invite_to_trip이 오류 메시지로 돌려주는 코드를 안내 문구로 바꾼다.
export function inviteErrorMessage(code: string) {
  return MESSAGES[code] ?? "초대하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}
