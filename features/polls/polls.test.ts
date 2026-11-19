import { describe, expect, it } from "vitest";

import { countVotes, topOptionIds, validatePollInput } from "./polls";

const options = [{ id: "a" }, { id: "b" }, { id: "c" }];

describe("countVotes", () => {
  it("후보별 득표 수를 센다 (AC4)", () => {
    const counts = countVotes(options, [{ optionId: "a" }, { optionId: "a" }, { optionId: "b" }]);
    expect(counts).toEqual({ a: 2, b: 1, c: 0 });
  });
});

describe("topOptionIds", () => {
  it("최고 득표가 하나면 그 후보만 돌려준다 (AC6)", () => {
    expect(topOptionIds({ a: 2, b: 1, c: 0 })).toEqual(["a"]);
  });

  it("동률이면 동률 후보를 모두 돌려준다 (AC7)", () => {
    expect(topOptionIds({ a: 1, b: 1, c: 0 })).toEqual(["a", "b"]);
  });

  it("표가 하나도 없으면 모든 후보가 동률이다 (AC7)", () => {
    expect(topOptionIds({ a: 0, b: 0 })).toEqual(["a", "b"]);
  });

  it("후보가 없으면 빈 목록이다", () => {
    expect(topOptionIds({})).toEqual([]);
  });
});

describe("validatePollInput", () => {
  const days = ["2026-12-12", "2026-12-13"];

  it("질문이 비어 있으면 이유를 돌려준다 (AC2)", () => {
    expect(validatePollInput({ question: "  ", day: "2026-12-12" }, days)).toBe("질문을 입력해 주세요.");
  });

  it("날짜가 없거나 여행 기간 밖이면 이유를 돌려준다 (AC2)", () => {
    expect(validatePollInput({ question: "점심", day: "" }, days)).toBe("반영할 날짜를 골라 주세요.");
    expect(validatePollInput({ question: "점심", day: "2026-12-20" }, days)).toBe("반영할 날짜를 골라 주세요.");
  });

  it("올바르면 null이다", () => {
    expect(validatePollInput({ question: "점심", day: "2026-12-13" }, days)).toBeNull();
  });
});
