import { describe, expect, it } from "vitest";

import { moveDayCounts } from "./days";

const items = [{ day: "2026-12-13" }, { day: "2026-12-13" }, { day: "2026-12-13" }, { day: "2026-12-15" }, { day: "2026-12-15" }];

describe("moveDayCounts", () => {
  it("옮길 일정 수와 맞바뀔 일정 수를 센다 (AC2)", () => {
    expect(moveDayCounts(items, "2026-12-13", "2026-12-15")).toEqual({ moving: 3, swapping: 2 });
  });

  it("대상 날짜가 비어 있으면 맞바뀔 일정이 0이다 (AC4)", () => {
    expect(moveDayCounts(items, "2026-12-13", "2026-12-14")).toEqual({ moving: 3, swapping: 0 });
  });

  it("일정이 없는 날짜끼리는 둘 다 0이다", () => {
    expect(moveDayCounts(items, "2026-12-12", "2026-12-14")).toEqual({ moving: 0, swapping: 0 });
  });
});
