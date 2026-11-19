import { describe, expect, it } from "vitest";

import { generateTempPassword, TEMP_PASSWORD_ALPHABET } from "./temp-password";

describe("generateTempPassword", () => {
  it("헷갈리는 글자 없이 10자를 만든다", () => {
    for (let i = 0; i < 50; i++) {
      const pw = generateTempPassword();
      expect(pw).toHaveLength(10);
      expect([...pw].every((c) => TEMP_PASSWORD_ALPHABET.includes(c))).toBe(true);
    }
    expect(TEMP_PASSWORD_ALPHABET).not.toMatch(/[0O1lI]/);
  });

  it("매번 다른 값을 만든다", () => {
    expect(new Set(Array.from({ length: 20 }, () => generateTempPassword())).size).toBe(20);
  });
});
