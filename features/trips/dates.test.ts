import { describe, expect, it } from "vitest";

import { copiedEndDate, dayLabel, isValidRange, tripDays, tripInputError, tripPeriodLabel } from "./dates";

describe("tripDays", () => {
  it("시작일부터 종료일까지 모든 날짜를 순서대로 돌려준다 (AC2)", () => {
    expect(tripDays("2026-12-12", "2026-12-15")).toEqual([
      "2026-12-12",
      "2026-12-13",
      "2026-12-14",
      "2026-12-15",
    ]);
  });

  it("월과 해가 바뀌어도 이어진다", () => {
    expect(tripDays("2026-12-31", "2027-01-02")).toEqual(["2026-12-31", "2027-01-01", "2027-01-02"]);
  });

  it("하루짜리 여행은 날짜 하나다", () => {
    expect(tripDays("2026-12-12", "2026-12-12")).toEqual(["2026-12-12"]);
  });
});

describe("isValidRange", () => {
  it("종료일이 시작일보다 앞서면 유효하지 않다 (AC2)", () => {
    expect(isValidRange("2026-12-15", "2026-12-12")).toBe(false);
    expect(isValidRange("2026-12-12", "2026-12-12")).toBe(true);
    expect(isValidRange("2026-12-12", "2026-12-15")).toBe(true);
  });

  it("비어 있거나 형식이 틀리면 유효하지 않다", () => {
    expect(isValidRange("", "2026-12-15")).toBe(false);
    expect(isValidRange("2026-12-12", "12/15")).toBe(false);
  });
});

describe("labels", () => {
  it("날짜를 한국어로 보여 준다", () => {
    expect(dayLabel("2026-12-12")).toEqual({ short: "12.12", weekday: "토", full: "12월 12일 · 토요일" });
  });

  it("여행 기간을 박·일과 함께 보여 준다", () => {
    expect(tripPeriodLabel("2026-12-12", "2026-12-15")).toBe("2026. 12. 12 – 12. 15 · 3박 4일");
    expect(tripPeriodLabel("2026-12-12", "2026-12-12")).toBe("2026. 12. 12 · 당일");
  });
});

describe("tripInputError", () => {
  it("제목이 비어 있으면 이유를 돌려준다 (AC2)", () => {
    expect(tripInputError({ title: "  ", start: "2026-12-12", end: "2026-12-15" })).toBe("제목을 입력해 주세요.");
  });

  it("날짜가 비어 있거나 종료일이 시작일보다 빠르면 이유를 돌려준다 (AC2)", () => {
    expect(tripInputError({ title: "후쿠오카", start: "", end: "2026-12-15" })).toBe("시작일과 종료일을 모두 정해 주세요.");
    expect(tripInputError({ title: "후쿠오카", start: "2026-12-15", end: "2026-12-12" })).toBe("종료일은 시작일보다 빠를 수 없습니다.");
  });

  it("올바르면 null이다", () => {
    expect(tripInputError({ title: "후쿠오카", start: "2026-12-12", end: "2026-12-15" })).toBeNull();
  });
});

describe("copiedEndDate", () => {
  it("원래 여행과 같은 길이의 종료일을 돌려준다 (AC5)", () => {
    expect(copiedEndDate("2026-12-12", "2026-12-15", "2027-01-30")).toBe("2027-02-02");
  });

  it("하루짜리 여행은 시작일이 곧 종료일이다", () => {
    expect(copiedEndDate("2026-12-12", "2026-12-12", "2027-03-01")).toBe("2027-03-01");
  });

  it("시작일이 비어 있으면 빈 문자열이다", () => {
    expect(copiedEndDate("2026-12-12", "2026-12-15", "")).toBe("");
  });
});
