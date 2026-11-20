// 금액은 통화의 가장 작은 단위(정수)로 저장한다. 달러는 센트(decimals 2), 나머지는 그대로.
// 환율은 "rateUnit 단위 외화 = 몇 원"으로 받는다(은행 고시 관례: 100엔, 1달러, 100동).
export const CURRENCIES = [
  { value: "JPY", label: "엔", symbol: "¥", decimals: 0, rateUnit: 100 },
  { value: "USD", label: "달러", symbol: "$", decimals: 2, rateUnit: 1 },
  { value: "VND", label: "동", symbol: "₫", decimals: 0, rateUnit: 100 },
  { value: "KRW", label: "원", symbol: "₩", decimals: 0, rateUnit: 1 },
] as const;

export type Currency = (typeof CURRENCIES)[number]["value"];
export type ForeignCurrency = Exclude<Currency, "KRW">;
export type Totals = Record<Currency, number>;
// 외화별 원 환율. 아직 안 넣었으면 null.
export type Rates = Record<ForeignCurrency, number | null>;

export const FOREIGN_CURRENCIES = CURRENCIES.filter((c) => c.value !== "KRW").map((c) => c.value as ForeignCurrency);
export const NO_RATES: Rates = { JPY: null, USD: null, VND: null };

const MAX_AMOUNT = 1_000_000_000;

const info = (currency: Currency) => CURRENCIES.find((c) => c.value === currency)!;
const emptyTotals = (): Totals => ({ JPY: 0, USD: 0, VND: 0, KRW: 0 });

// 쉼표·공백을 뺀 양수를 가장 작은 단위의 정수로. 달러는 센트까지, 나머지는 정수만. 아니면 null.
export function parseAmount(input: string, currency: Currency): number | null {
  const s = input.replace(/[,\s]/g, "");
  const { decimals } = info(currency);
  const pattern = decimals ? new RegExp(`^\\d+(\\.\\d{1,${decimals}})?$`) : /^\d+$/;
  if (!pattern.test(s)) return null;
  const [whole, frac = ""] = s.split(".");
  const n = Number(whole) * 10 ** decimals + Number(frac.padEnd(decimals, "0") || 0);
  return n > 0 && n <= MAX_AMOUNT ? n : null;
}

// 입력칸에 다시 채울 금액 문자열(기호 없이).
export function formatAmount(amount: number, currency: Currency): string {
  const { decimals } = info(currency);
  return (amount / 10 ** decimals).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// 환율(rateUnit 단위당 원). 소수 둘째 자리까지의 양수.
export function parseRate(input: string): number | null {
  const s = input.replace(/[,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return n > 0 && n < 100_000 ? n : null;
}

// "100엔", "1달러"처럼 환율의 기준 단위.
export function rateUnitLabel(currency: ForeignCurrency): string {
  const c = info(currency);
  return `${c.rateUnit}${c.label}`;
}

// 가장 작은 단위 금액을 원으로. 원 단위 반올림. 환율이 없으면 null.
export function convertToKrw(amount: number, currency: Currency, rates: Rates): number | null {
  if (currency === "KRW") return amount;
  const rate = rates[currency];
  if (rate === null) return null;
  const { decimals, rateUnit } = info(currency);
  return Math.round((amount * rate) / (10 ** decimals * rateUnit));
}

export function validateExpense(input: { title: string; amount: string; currency: Currency; shareUserIds: string[] }): string | null {
  if (!input.title.trim()) return "내용을 입력해 주세요.";
  if (input.title.trim().length > 100) return "내용은 100자까지 쓸 수 있습니다.";
  if (parseAmount(input.amount, input.currency) === null) {
    return info(input.currency).decimals ? "금액은 0보다 큰 숫자로 입력해 주세요(소수 둘째 자리까지)." : "금액은 1 이상의 정수로 입력해 주세요.";
  }
  if (!input.shareUserIds.length) return "나눌 사람을 한 명 이상 골라 주세요.";
  return null;
}

// 날짜순 날짜별 합계와 전체 합계. 쓴 외화의 환율이 모두 있으면 원으로 합친 금액도 낸다.
export function summarize(expenses: { spentOn: string; amount: number; currency: Currency }[], rates: Rates) {
  const total = emptyTotals();
  const byDay = new Map<string, Totals>();
  for (const e of expenses) {
    const day = byDay.get(e.spentOn) ?? emptyTotals();
    day[e.currency] += e.amount;
    byDay.set(e.spentOn, day);
    total[e.currency] += e.amount;
  }
  const days = [...byDay.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([day, totals]) => ({ day, totals }));
  let totalInKrw: number | null = 0;
  for (const c of CURRENCIES) {
    if (!total[c.value]) continue;
    const krw = convertToKrw(total[c.value], c.value, rates);
    totalInKrw = krw === null || totalInKrw === null ? null : totalInKrw + krw;
  }
  return { days, total, totalInKrw };
}

// 합계에 들어 있는 통화(표시 순서대로).
export function usedCurrencies(totals: Totals): Currency[] {
  return CURRENCIES.map((c) => c.value).filter((c) => totals[c] > 0);
}

export function formatMoney(amount: number, currency: Currency): string {
  return info(currency).symbol + formatAmount(amount, currency);
}

export function defaultExpenseDay(days: string[], today: string): string {
  return days.includes(today) ? today : days[0];
}
