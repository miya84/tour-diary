import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { Currency } from "./expenses";
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

// 100엔당 원. 아직 안 넣었으면 null.
export async function getExchangeRate(tripId: string): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("trip_exchange_rates").select("krw_per_100_jpy").eq("trip_id", tripId).maybeSingle();
  if (error) throw error;
  return data ? Number(data.krw_per_100_jpy) : null;
}
