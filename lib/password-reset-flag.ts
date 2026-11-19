// 어드민이 비밀번호를 초기화한 계정의 표시. Supabase Auth의 app_metadata(사용자가 바꿀 수 없는 칸)에 두고,
// 로그인 토큰에 함께 실린다. proxy, 어드민 초기화, 새 비밀번호 저장이 함께 쓴다.
export const MUST_CHANGE_PASSWORD_KEY = "must_change_password";

export const RESET_PASSWORD_PATH = "/auth/reset-password";

export function mustChangePassword(claims: { app_metadata?: unknown } | null | undefined): boolean {
  const meta = claims?.app_metadata as Record<string, unknown> | undefined;
  return meta?.[MUST_CHANGE_PASSWORD_KEY] === true;
}
