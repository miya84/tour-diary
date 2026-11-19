export const NICKNAME_MAX = 20;

export type NicknameResult = { ok: true; nickname: string } | { ok: false; error: string };

// 닉네임은 1~20자, 중복은 허용한다. DB 제약(profiles_nickname check)과 같은 기준이다.
export function validateNickname(input: string): NicknameResult {
  const nickname = input.trim();
  if (!nickname) return { ok: false, error: "닉네임을 입력해 주세요." };
  if ([...nickname].length > NICKNAME_MAX) {
    return { ok: false, error: `닉네임은 ${NICKNAME_MAX}자 이하로 입력해 주세요.` };
  }
  return { ok: true, nickname };
}
