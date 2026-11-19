import { describe, expect, it } from "vitest";

import { settle, toKrw, transferKey } from "./settlement";

type E = Parameters<typeof settle>[0][number];
const e = (amount: number, currency: E["currency"], paidBy: string, shareUserIds: string[]): E => ({ amount, currency, paidBy, shareUserIds });

const ok = (result: ReturnType<typeof settle>) => {
  if (result.status !== "ok") throw new Error(`expected ok, got ${result.status}`);
  return result;
};

// 보낼 돈 목록대로 보낸 뒤의 차액.
const afterTransfers = (r: ReturnType<typeof ok>) => {
  const net = new Map(r.people.map((p) => [p.userId, p.net]));
  for (const t of r.transfers) {
    net.set(t.from, net.get(t.from)! + t.amount);
    net.set(t.to, net.get(t.to)! - t.amount);
  }
  return [...net.values()];
};

describe("toKrw", () => {
  it("원은 그대로, 엔은 금액 × 환율 ÷ 100을 원 단위 반올림 (AC3)", () => {
    expect(toKrw(15000, "KRW", null)).toBe(15000);
    expect(toKrw(2980, "JPY", 918.35)).toBe(27367); // 27366.83
    expect(toKrw(1500, "JPY", 918.35)).toBe(13775); // 13775.25
  });
});

describe("settle", () => {
  it("경비가 없으면 empty (AC1)", () => {
    expect(settle([], null).status).toBe("empty");
  });

  it("엔 경비가 있는데 환율이 없으면 needs_rate, 원 경비만 있으면 환율 없이 정산 (AC2)", () => {
    expect(settle([e(1000, "JPY", "a", ["a", "b"])], null).status).toBe("needs_rate");
    expect(settle([e(10000, "KRW", "a", ["a", "b"])], null).status).toBe("ok");
  });

  it("나누어떨어지지 않으면 남는 1원을 사용자 ID 순서로 더 부담하고, 부담 합계는 총액과 같다 (AC4)", () => {
    const r = ok(settle([e(10000, "KRW", "a", ["c", "b", "a"])], null));
    const owed = Object.fromEntries(r.people.map((p) => [p.userId, p.owed]));
    expect(owed).toEqual({ a: 3334, b: 3333, c: 3333 });
    expect(r.people.reduce((s, p) => s + p.owed, 0)).toBe(r.total);
    expect(r.total).toBe(10000);
  });

  it("차액은 낸 돈 − 부담할 돈이고, 합은 0이다 (AC5)", () => {
    const r = ok(settle([e(30000, "KRW", "a", ["a", "b", "c"]), e(9000, "KRW", "b", ["b", "c"])], null));
    const byId = Object.fromEntries(r.people.map((p) => [p.userId, p]));
    expect(byId.a).toMatchObject({ paid: 30000, owed: 10000, net: 20000 });
    expect(byId.b).toMatchObject({ paid: 9000, owed: 14500, net: -5500 });
    expect(byId.c).toMatchObject({ paid: 0, owed: 14500, net: -14500 });
    expect(r.people.reduce((s, p) => s + p.net, 0)).toBe(0);
  });

  it("보낼 돈 목록대로 보내면 모두 0이고, 송금은 사람 수 − 1번 이하 (AC6)", () => {
    const r = ok(
      settle(
        [
          e(30000, "KRW", "a", ["a", "b", "c", "d"]),
          e(2980, "JPY", "b", ["a", "b", "c", "d"]),
          e(7777, "KRW", "c", ["a", "c"]),
          e(1500, "JPY", "d", ["b", "d"]),
        ],
        918.35,
      ),
    );
    expect(afterTransfers(r).every((n) => n === 0)).toBe(true);
    expect(r.transfers.length).toBeLessThanOrEqual(r.people.length - 1);
    expect(r.transfers.every((t) => t.amount > 0 && t.from !== t.to)).toBe(true);
  });

  it("엔 경비는 경비 한 건마다 원으로 바꿔 나눈다 (AC3, AC4)", () => {
    const r = ok(settle([e(2980, "JPY", "a", ["a", "b"])], 918.35));
    expect(r.total).toBe(27367);
    expect(r.transfers).toEqual([{ from: "b", to: "a", amount: 13683 }]);
  });

  it("자기 혼자 나눈 경비만 있으면 보낼 돈이 없다 (AC6)", () => {
    const r = ok(settle([e(5000, "KRW", "a", ["a"])], null));
    expect(r.transfers).toEqual([]);
  });

  it("같은 입력이면 순서와 관계없이 같은 결과", () => {
    const list = [e(10000, "KRW", "a", ["a", "b", "c"]), e(7000, "KRW", "b", ["a", "b", "c"])];
    expect(settle(list, null)).toEqual(settle([...list].reverse(), null));
  });
});

describe("transferKey", () => {
  it("보낸 사람·받는 사람·금액이 같아야 같은 송금이다 (AC8)", () => {
    expect(transferKey({ from: "b", to: "a", amount: 100 })).toBe(transferKey({ from: "b", to: "a", amount: 100 }));
    expect(transferKey({ from: "b", to: "a", amount: 100 })).not.toBe(transferKey({ from: "b", to: "a", amount: 101 }));
  });
});
