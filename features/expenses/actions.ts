"use server";

import { revalidatePath } from "next/cache";

import { createClient, getCurrentUser } from "@/lib/supabase/server";

import { CURRENCIES, parseAmount, parseRate, validateExpense } from "./expenses";
import type { Transfer } from "./settlement";
import type { ExpenseInput } from "./types";

type Result = { error?: string };

async function authed() {
  const user = await getCurrentUser();
  if (!user) throw new Error("로그인이 필요합니다.");
  return createClient();
}

export async function saveExpense(tripId: string, input: ExpenseInput, expenseId?: string): Promise<Result> {
  const message = validateExpense(input);
  if (message) return { error: message };
  if (!CURRENCIES.some((c) => c.value === input.currency)) return { error: "통화를 골라 주세요." };
  if (input.note.length > 1000) return { error: "메모는 1,000자까지 쓸 수 있습니다." };

  const supabase = await authed();
  const { error } = await supabase.rpc("save_expense", {
    p_trip_id: tripId,
    p_expense_id: expenseId ?? null,
    p_title: input.title,
    p_amount: parseAmount(input.amount),
    p_currency: input.currency,
    p_paid_by: input.paidBy,
    p_spent_on: input.spentOn,
    p_note: input.note,
    p_share_user_ids: input.shareUserIds,
  });
  if (error) return { error: "경비를 저장하지 못했습니다." };
  revalidatePath(`/trips/${tripId}`);
  return {};
}

export async function deleteExpense(tripId: string, expenseId: string): Promise<Result> {
  const supabase = await authed();
  const { error, count } = await supabase.from("expenses").delete({ count: "exact" }).eq("id", expenseId).eq("trip_id", tripId);
  if (error || count === 0) return { error: "경비를 지우지 못했습니다." };
  revalidatePath(`/trips/${tripId}`);
  return {};
}

// 송금 완료 표시와 해제.
export async function setTransferPaid(tripId: string, transfer: Transfer, paid: boolean): Promise<Result> {
  if (!(transfer.amount > 0) || !Number.isInteger(transfer.amount) || transfer.from === transfer.to) return { error: "송금 정보가 올바르지 않습니다." };
  const supabase = await authed();
  const row = { trip_id: tripId, from_user: transfer.from, to_user: transfer.to, amount: transfer.amount };
  const { error } = paid
    ? await supabase.from("settlement_payments").upsert(row, { ignoreDuplicates: true })
    : await supabase.from("settlement_payments").delete().match(row);
  if (error) return { error: "완료 표시를 저장하지 못했습니다." };
  revalidatePath(`/trips/${tripId}`);
  return {};
}

export async function saveExchangeRate(tripId: string, input: string): Promise<Result> {
  const rate = parseRate(input);
  if (rate === null) return { error: "환율은 0보다 큰 숫자로 입력해 주세요(소수 둘째 자리까지)." };
  const supabase = await authed();
  const { error } = await supabase
    .from("trip_exchange_rates")
    .upsert({ trip_id: tripId, krw_per_100_jpy: rate, updated_at: new Date().toISOString() });
  if (error) return { error: "환율을 저장하지 못했습니다." };
  revalidatePath(`/trips/${tripId}`);
  return {};
}
