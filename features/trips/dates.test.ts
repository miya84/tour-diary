import { describe, expect, it } from "vitest";

import { dayLabel, isValidRange, tripDays, tripPeriodLabel } from "./dates";

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
