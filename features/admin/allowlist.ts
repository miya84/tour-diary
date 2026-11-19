// 가입 허용 목록의 이메일은 대소문자와 앞뒤 공백을 무시한다. DB의 저장 규칙과 같다.
export const normalizeEmail = (input: string) => input.trim().toLowerCase();

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function validateAllowlistEmail(input: string, existing: string[]): string | null {
  const email = normalizeEmail(input);
  if (!email) return "이메일을 입력해 주세요.";
  if (!EMAIL.test(email)) return "이메일 형식이 아닙니다.";
  if (existing.includes(email)) return "이미 목록에 있는 이메일입니다.";
  return null;
}
