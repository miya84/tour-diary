export const CURRENCIES = [
  { value: "JPY", label: "엔", symbol: "¥" },
  { value: "KRW", label: "원", symbol: "₩" },
] as const;

export type Currency = (typeof CURRENCIES)[number]["value"];
export type Totals = Record<Currency, number>;

const MAX_AMOUNT = 1_000_000_000;

// 쉼표·공백을 뺀 양의 정수. 아니면 null.
export function parseAmount(input: string): number | null {
  const s = input.replace(/[,\s]/g, "");
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return n > 0 && n <= MAX_AMOUNT ? n : null;
}

// 100엔당 원. 소수 둘째 자리까지의 양수.
export function parseRate(input: string): number | null {
  const s = input.replace(/[,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return n > 0 && n < 100_000 ? n : null;
}

export function validateExpense(input: { title: string; amount: string; shareUserIds: string[] }): string | null {
  if (!input.title.trim()) return "내용을 입력해 주세요.";
  if (input.title.trim().length > 100) return "내용은 100자까지 쓸 수 있습니다.";
  if (parseAmount(input.amount) === null) return "금액은 1 이상의 정수로 입력해 주세요.";
  if (!input.shareUserIds.length) return "나눌 사람을 한 명 이상 골라 주세요.";
  return null;
}

// 날짜순 날짜별 합계와 전체 합계. 환율이 있으면 원으로 합친 금액도 낸다.
export function summarize(expenses: { spentOn: string; amount: number; currency: Currency }[], krwPer100Jpy: number | null) {
  const total: Totals = { JPY: 0, KRW: 0 };
  const byDay = new Map<string, Totals>();
  for (const e of expenses) {
    const day = byDay.get(e.spentOn) ?? { JPY: 0, KRW: 0 };
    day[e.currency] += e.amount;
    byDay.set(e.spentOn, day);
    total[e.currency] += e.amount;
  }
  const days = [...byDay.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([day, totals]) => ({ day, totals }));
  const totalInKrw = krwPer100Jpy === null ? null : total.KRW + Math.round((total.JPY * krwPer100Jpy) / 100);
  return { days, total, totalInKrw };
}

export function formatMoney(amount: number, currency: Currency): string {
  const symbol = CURRENCIES.find((c) => c.value === currency)!.symbol;
  return symbol + amount.toLocaleString("en-US");
}

export function defaultExpenseDay(days: string[], today: string): string {
  return days.includes(today) ? today : days[0];
}
