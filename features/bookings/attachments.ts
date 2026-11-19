export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
export const ATTACHMENT_MAX_COUNT = 5;
export const ATTACHMENT_TYPES = ["image/jpeg", "image/png", "image/webp"];

// 올리려는 파일이 규칙을 지키는지 본다. 문제가 없으면 null, 있으면 사용자에게 보일 이유.
export function validateAttachments(existingCount: number, files: { type: string; size: number }[]): string | null {
  if (files.some((f) => !ATTACHMENT_TYPES.includes(f.type))) return "이미지(JPG·PNG·WebP)만 올릴 수 있습니다.";
  if (files.some((f) => f.size > ATTACHMENT_MAX_BYTES)) return "이미지는 파일당 10MB 이하여야 합니다.";
  if (existingCount + files.length > ATTACHMENT_MAX_COUNT) return `첨부는 예약당 ${ATTACHMENT_MAX_COUNT}개까지입니다.`;
  return null;
}
