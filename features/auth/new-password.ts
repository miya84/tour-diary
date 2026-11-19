// Supabase Auth 기본 최소 길이와 같다.
export const MIN_PASSWORD_LENGTH = 6;

export function validateNewPassword(password: string, repeat: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`;
  if (password !== repeat) return "비밀번호가 서로 다릅니다.";
  return null;
}

// 로그인한 사람이 프로필에서 바꿀 때.
export function validatePasswordChange(current: string, password: string, repeat: string): string | null {
  if (!current) return "현재 비밀번호를 입력해 주세요.";
  const message = validateNewPassword(password, repeat);
  if (message) return message;
  if (password === current) return "현재 비밀번호와 다른 비밀번호를 정해 주세요.";
  return null;
}
