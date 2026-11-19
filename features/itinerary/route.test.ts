import { describe, expect, it } from "vitest";

import { moveId, pinNumbers, routePoints } from "./route";

const items = [
  { id: "a", place: null },
  { id: "b", place: { lat: 33.26, lng: 131.35 } },
  { id: "c", place: null },
  { id: "d", place: { lat: 33.27, lng: 131.36 } },
  { id: "e", place: { lat: 33.28, lng: 131.37 } },
];

describe("pinNumbers", () => {
  it("장소가 있는 항목에만 목록 순서대로 1부터 번호를 매긴다 (AC5, AC3)", () => {
    expect(pinNumbers(items)).toEqual(new Map([["b", 1], ["d", 2], ["e", 3]]));
  });

  it("장소를 빼면 나머지 번호가 다시 매겨진다 (AC7)", () => {
    const withoutD = items.map((i) => (i.id === "d" ? { ...i, place: null } : i));
    expect(pinNumbers(withoutD)).toEqual(new Map([["b", 1], ["e", 2]]));
  });
});

describe("routePoints", () => {
  it("장소가 있는 항목의 좌표를 목록 순서대로 돌려준다", () => {
    expect(routePoints(items)).toEqual([
      { id: "b", lat: 33.26, lng: 131.35, number: 1 },
      { id: "d", lat: 33.27, lng: 131.36, number: 2 },
      { id: "e", lat: 33.28, lng: 131.37, number: 3 },
    ]);
  });
});

describe("moveId", () => {
  it("항목을 다른 항목 앞으로 옮긴다 (AC12)", () => {
    expect(moveId(["a", "b", "c", "d"], "d", "b")).toEqual(["a", "d", "b", "c"]);
  });

  it("대상이 없으면 맨 끝으로 옮긴다", () => {
    expect(moveId(["a", "b", "c"], "a", null)).toEqual(["b", "c", "a"]);
  });

  it("제자리로 옮기면 순서가 그대로다", () => {
    expect(moveId(["a", "b", "c"], "b", "c")).toEqual(["a", "b", "c"]);
  });
});
