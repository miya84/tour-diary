import { describe, expect, it } from "vitest";

import { ATTACHMENT_MAX_BYTES, ATTACHMENT_MAX_COUNT, validateAttachments } from "./attachments";

const img = (size = 1000, type = "image/png") => ({ type, size });

describe("validateAttachments", () => {
  it("허용 형식과 크기면 통과한다 (AC5)", () => {
    expect(validateAttachments(0, [img(), img(5, "image/jpeg"), img(5, "image/webp")])).toBeNull();
  });

  it("PDF 같은 다른 형식은 거부한다", () => {
    expect(validateAttachments(0, [img(1000, "application/pdf")])).toBe("이미지(JPG·PNG·WebP)만 올릴 수 있습니다.");
  });

  it("10MB를 넘으면 거부하고 정확히 10MB는 허용한다", () => {
    expect(validateAttachments(0, [img(ATTACHMENT_MAX_BYTES)])).toBeNull();
    expect(validateAttachments(0, [img(ATTACHMENT_MAX_BYTES + 1)])).toBe("이미지는 파일당 10MB 이하여야 합니다.");
  });

  it("기존 첨부와 합쳐 5개를 넘으면 거부한다", () => {
    expect(validateAttachments(3, [img(), img()])).toBeNull();
    expect(validateAttachments(3, [img(), img(), img()])).toBe(`첨부는 예약당 ${ATTACHMENT_MAX_COUNT}개까지입니다.`);
  });
});
