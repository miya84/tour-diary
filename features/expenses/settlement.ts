import type { Currency } from "./expenses";

export type Transfer = { from: string; to: string; amount: number };
export type PersonBalance = { userId: string; paid: number; owed: number; net: number };

type SettleExpense = { amount: number; currency: Currency; paidBy: string; shareUserIds: string[] };

export type Settlement =
  | { status: "empty" }
  | { status: "needs_rate" }
  | { status: "ok"; total: number; people: PersonBalance[]; transfers: Transfer[] };

// 경비 한 건의 원 금액. 엔은 금액 × (100엔당 원) ÷ 100을 원 단위 반올림.
export function toKrw(amount: number, currency: Currency, krwPer100Jpy: number | null): number {
  if (currency === "KRW") return amount;
  if (krwPer100Jpy === null) throw new Error("환율이 필요합니다.");
  return Math.round((amount * krwPer100Jpy) / 100);
}

const byId = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

// 모두 원으로 정산한다. 경비 한 건씩 원으로 바꿔 나눌 사람에게 똑같이 나누고,
// 남는 1원은 사용자 ID 순서로 한 사람씩 더 부담한다.
export function settle(expenses: SettleExpense[], krwPer100Jpy: number | null): Settlement {
  if (!expenses.length) return { status: "empty" };
  if (krwPer100Jpy === null && expenses.some((e) => e.currency === "JPY")) return { status: "needs_rate" };

  const balances = new Map<string, PersonBalance>();
  const person = (userId: string) => {
    let p = balances.get(userId);
    if (!p) balances.set(userId, (p = { userId, paid: 0, owed: 0, net: 0 }));
    return p;
  };

  let total = 0;
  for (const e of expenses) {
    const krw = toKrw(e.amount, e.currency, krwPer100Jpy);
    total += krw;
    person(e.paidBy).paid += krw;
    const sharers = [...new Set(e.shareUserIds)].sort(byId);
    const base = Math.floor(krw / sharers.length);
    const remainder = krw - base * sharers.length;
    sharers.forEach((id, i) => (person(id).owed += base + (i < remainder ? 1 : 0)));
  }

  const people = [...balances.values()].sort((a, b) => byId(a.userId, b.userId));
  for (const p of people) p.net = p.paid - p.owed;

  return { status: "ok", total, people, transfers: matchTransfers(people) };
}

// 받을 돈이 가장 많은 사람과 보낼 돈이 가장 많은 사람부터 짝짓는다.
// 한 번 짝지을 때마다 적어도 한 사람이 0이 되므로 송금은 사람 수 − 1번을 넘지 않는다.
function matchTransfers(people: PersonBalance[]): Transfer[] {
  const largestFirst = (a: { id: string; left: number }, b: { id: string; left: number }) => b.left - a.left || byId(a.id, b.id);
  const creditors = people.filter((p) => p.net > 0).map((p) => ({ id: p.userId, left: p.net }));
  const debtors = people.filter((p) => p.net < 0).map((p) => ({ id: p.userId, left: -p.net }));
  const transfers: Transfer[] = [];

  while (creditors.length && debtors.length) {
    creditors.sort(largestFirst);
    debtors.sort(largestFirst);
    const c = creditors[0];
    const d = debtors[0];
    const amount = Math.min(c.left, d.left);
    transfers.push({ from: d.id, to: c.id, amount });
    c.left -= amount;
    d.left -= amount;
    if (!c.left) creditors.shift();
    if (!d.left) debtors.shift();
  }
  return transfers;
}

// 완료 표시는 보낸 사람·받는 사람·금액이 모두 같은 송금에만 붙는다.
export const transferKey = (t: Transfer) => `${t.from}>${t.to}:${t.amount}`;
