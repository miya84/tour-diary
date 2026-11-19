import { describe, expect, it } from "vitest";

import { defaultExpenseDay, formatMoney, parseAmount, parseRate, summarize, validateExpense } from "./expenses";

describe("parseAmount", () => {
  it("쉼표와 공백을 빼고 양의 정수를 읽는다 (AC3)", () => {
    expect(parseAmount("1,200")).toBe(1200);
    expect(parseAmount(" 15000 ")).toBe(15000);
  });

  it("비었거나 0 이하이거나 정수가 아니면 null (AC3)", () => {
    for (const v of ["", "0", "-500", "12.5", "abc", "1e3", "10000000001"]) expect(parseAmount(v)).toBeNull();
  });
});

describe("parseRate", () => {
  it("소수 둘째 자리까지의 양수를 읽는다 (AC6)", () => {
    expect(parseRate("920")).toBe(920);
    expect(parseRate("918.35")).toBe(918.35);
  });

  it("0 이하, 숫자가 아님, 소수 셋째 자리는 null (AC6)", () => {
    for (const v of ["", "0", "-1", "abc", "918.355"]) expect(parseRate(v)).toBeNull();
  });
});

describe("validateExpense", () => {
  const ok = { title: "이치란 라멘", amount: "2,980", shareUserIds: ["a"] };

  it("내용, 금액, 나눌 사람이 있으면 통과한다 (AC2)", () => {
    expect(validateExpense(ok)).toBeNull();
  });

  it("빠진 것마다 이유를 돌려준다 (AC3)", () => {
    expect(validateExpense({ ...ok, title: "  " })).toBe("내용을 입력해 주세요.");
    expect(validateExpense({ ...ok, amount: "0" })).toBe("금액은 1 이상의 정수로 입력해 주세요.");
    expect(validateExpense({ ...ok, shareUserIds: [] })).toBe("나눌 사람을 한 명 이상 골라 주세요.");
  });
});

describe("summarize", () => {
  const list = [
    { spentOn: "2026-12-13", amount: 2980, currency: "JPY" as const },
    { spentOn: "2026-12-12", amount: 1200, currency: "JPY" as const },
    { spentOn: "2026-12-12", amount: 15000, currency: "KRW" as const },
  ];

  it("날짜순으로 날짜별 통화 합계를 낸다 (AC4)", () => {
    const { days } = summarize(list, null);
    expect(days.map((d) => [d.day, d.totals])).toEqual([
      ["2026-12-12", { JPY: 1200, KRW: 15000 }],
      ["2026-12-13", { JPY: 2980, KRW: 0 }],
    ]);
  });

  it("전체 합계는 통화별, 환율이 없으면 원 환산이 없다 (AC5)", () => {
    const s = summarize(list, null);
    expect(s.total).toEqual({ JPY: 4180, KRW: 15000 });
    expect(s.totalInKrw).toBeNull();
  });

  it("원 환산 = 원 합계 + 엔 합계 × 환율 ÷ 100, 원 단위 반올림 (AC5)", () => {
    // 4180 × 918.35 / 100 = 38387.03 → 38387
    expect(summarize(list, 918.35).totalInKrw).toBe(15000 + 38387);
  });

  it("경비가 없으면 0과 빈 날짜 목록", () => {
    expect(summarize([], 920)).toEqual({ days: [], total: { JPY: 0, KRW: 0 }, totalInKrw: 0 });
  });
});

describe("formatMoney", () => {
  it("¥1,200, ₩15,000 형식으로 쓴다 (AC4)", () => {
    expect(formatMoney(1200, "JPY")).toBe("¥1,200");
    expect(formatMoney(15000, "KRW")).toBe("₩15,000");
  });
});

describe("defaultExpenseDay", () => {
  const days = ["2026-12-12", "2026-12-13", "2026-12-14"];

  it("오늘이 여행 기간이면 오늘 (AC2)", () => {
    expect(defaultExpenseDay(days, "2026-12-13")).toBe("2026-12-13");
  });

  it("여행 기간 밖이면 첫날 (AC2)", () => {
    expect(defaultExpenseDay(days, "2026-11-19")).toBe("2026-12-12");
  });
});
