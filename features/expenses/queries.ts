import "server-only";

import { createClient } from "@/lib/supabase/server";

import { type Currency, type ForeignCurrency, NO_RATES, type Rates } from "./expenses";
import { transferKey } from "./settlement";
import type { Expense } from "./types";

// 멤버만 읽을 수 있다(RLS).
export async function listExpenses(tripId: string): Promise<Expense[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("id, title, amount, currency, paid_by, spent_on, note, created_at, expense_shares(user_id)")
    .eq("trip_id", tripId)
    .order("spent_on")
    .order("created_at");
  if (error) throw error;
  return data.map((e) => ({
    id: e.id,
    title: e.title,
    amount: Number(e.amount),
    currency: e.currency as Currency,
    paidBy: e.paid_by,
    spentOn: e.spent_on,
    note: e.note ?? "",
    shareUserIds: (e.expense_shares as { user_id: string }[]).map((s) => s.user_id),
  }));
}

// 완료로 표시한 송금의 키(보낸 사람·받는 사람·금액).
export async function listPaidTransferKeys(tripId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("settlement_payments").select("from_user, to_user, amount").eq("trip_id", tripId);
  if (error) throw error;
  return data.map((p) => transferKey({ from: p.from_user, to: p.to_user, amount: Number(p.amount) }));
}

// 외화별 환율 컬럼. "100엔 = krw_per_100_jpy원", "1달러 = krw_per_1_usd원", "100동 = krw_per_100_vnd원".
export const RATE_COLUMNS = { JPY: "krw_per_100_jpy", USD: "krw_per_1_usd", VND: "krw_per_100_vnd" } as const satisfies Record<ForeignCurrency, string>;

// 외화별 원 환율. 아직 안 넣은 통화는 null.
export async function getExchangeRates(tripId: string): Promise<Rates> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trip_exchange_rates")
    .select("krw_per_100_jpy, krw_per_1_usd, krw_per_100_vnd")
    .eq("trip_id", tripId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return NO_RATES;
  const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  return { JPY: num(data.krw_per_100_jpy), USD: num(data.krw_per_1_usd), VND: num(data.krw_per_100_vnd) };
}
