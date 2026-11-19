import { describe, expect, it } from "vitest";

import { lockedBy, type PresenceState } from "./locks";

const state = (clientId: string, name: string, locks: [string, number][]): PresenceState => ({
  clientId,
  name,
  locks: locks.map(([key, at]) => ({ key, at })),
});

describe("lockedBy", () => {
  it("다른 사람이 잠근 항목은 그 사람 이름을 돌려준다 (AC4)", () => {
    const states = [state("a", "미야", []), state("b", "석", [["item:1", 10]])];
    expect(lockedBy(states, "item:1", "a")).toBe("석");
  });

  it("잠기지 않은 항목은 null이다 (AC4)", () => {
    const states = [state("b", "석", [["item:1", 10]])];
    expect(lockedBy(states, "item:2", "a")).toBeNull();
  });

  it("내가 잠근 항목은 null이다", () => {
    const states = [state("a", "미야", [["item:1", 10]])];
    expect(lockedBy(states, "item:1", "a")).toBeNull();
  });

  it("동시에 잠그면 시각이 이른 쪽이 가진다 (AC9)", () => {
    const states = [state("a", "미야", [["item:1", 20]]), state("b", "석", [["item:1", 10]])];
    expect(lockedBy(states, "item:1", "a")).toBe("석");
    expect(lockedBy(states, "item:1", "b")).toBeNull();
  });

  it("시각이 같으면 clientId가 작은 쪽이 가진다 (AC9)", () => {
    const states = [state("b", "석", [["item:1", 10]]), state("a", "미야", [["item:1", 10]])];
    expect(lockedBy(states, "item:1", "b")).toBe("미야");
    expect(lockedBy(states, "item:1", "a")).toBeNull();
  });

  it("날짜별 순서 잠금은 다른 날짜와 구분된다 (AC6)", () => {
    const states = [state("b", "석", [["order:2026-12-12", 10]])];
    expect(lockedBy(states, "order:2026-12-12", "a")).toBe("석");
    expect(lockedBy(states, "order:2026-12-13", "a")).toBeNull();
  });
});
