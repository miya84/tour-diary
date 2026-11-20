"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { expenseLock } from "@/features/realtime/locks";
import { useLock, useLockHolder } from "@/features/realtime/trip-realtime";
import { dayLabel } from "@/features/trips/dates";

import { saveExchangeRate } from "./actions";
import { ExpenseFormSheet } from "./expense-form-sheet";
import {
  defaultExpenseDay,
  FOREIGN_CURRENCIES,
  type ForeignCurrency,
  formatMoney,
  rateUnitLabel,
  type Rates,
  summarize,
  type Totals,
  usedCurrencies,
} from "./expenses";
import { settle } from "./settlement";
import { SettlementSheet } from "./settlement-sheet";
import type { Expense, ExpensePerson } from "./types";

export function ExpensesView({
  tripId,
  days,
  people,
  currentUserId,
  expenses,
  rates,
  paidTransferKeys,
}: {
  tripId: string;
  days: string[];
  people: ExpensePerson[];
  currentUserId: string;
  expenses: Expense[];
  rates: Rates;
  paidTransferKeys: string[];
}) {
  const [form, setForm] = useState<{ open: boolean; expense: Expense | null; day: string }>({ open: false, expense: null, day: days[0] });
  // 수정 화면이 열려 있는 동안 다른 멤버가 같은 경비를 못 고치게 잠근다.
  useLock(form.expense ? expenseLock(form.expense.id) : null, form.open);
  const holder = useLockHolder();
  const { days: groups, total, totalInKrw } = summarize(expenses, rates);
  const nickname = (id: string) => people.find((p) => p.userId === id)?.nickname ?? "나간 멤버";

  // 오늘 날짜는 여는 순간 기기 시간대로 정한다.
  const openNew = () => setForm({ open: true, expense: null, day: defaultExpenseDay(days, new Date().toLocaleDateString("sv-SE")) });

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">경비</h2>
        <Button size="sm" onClick={openNew}>
          ＋ 경비 추가
        </Button>
      </div>

      <section className="flex flex-col gap-2 rounded-2xl bg-card p-4 shadow-soft ring-1 ring-foreground/5">
        <div className="text-xs text-muted-foreground">전체 합계</div>
        <TotalsLine totals={total} className="text-2xl font-bold text-primary" />
        {totalInKrw !== null && usedCurrencies(total).some((c) => c !== "KRW") && (
          <div className="text-sm">원으로 합치면 약 {formatMoney(totalInKrw, "KRW")}</div>
        )}
        <RatesPanel tripId={tripId} rates={rates} used={usedCurrencies(total)} />
        <div className="flex justify-end border-t pt-2">
          <SettlementSheet tripId={tripId} settlement={settle(expenses, rates)} paidKeys={paidTransferKeys} nickname={nickname} />
        </div>
      </section>

      {groups.length ? (
        groups.map((g) => (
          <section key={g.day} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold">{dayLabel(g.day).full}</h3>
              <TotalsLine totals={g.totals} className="text-sm text-muted-foreground" />
            </div>
            <ul className="divide-y overflow-hidden rounded-2xl bg-card shadow-soft ring-1 ring-foreground/5">
              {expenses
                .filter((e) => e.spentOn === g.day)
                .map((e) => {
                  const editor = holder(expenseLock(e.id));
                  return (
                  <li key={e.id}>
                    <button
                      type="button"
                      disabled={!!editor}
                      onClick={() => setForm({ open: true, expense: e, day: e.spentOn })}
                      className="grid w-full grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 disabled:opacity-60"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{e.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {editor ? `${editor}님이 수정 중` : `${nickname(e.paidBy)} 냄 · ${e.shareUserIds.length}명이 나눔`}
                        </span>
                      </span>
                      <span className="text-sm font-semibold tabular-nums">{formatMoney(e.amount, e.currency)}</span>
                    </button>
                  </li>
                  );
                })}
            </ul>
          </section>
        ))
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-muted/70 px-4 py-8 text-center text-sm text-muted-foreground">
          <b className="text-[15px] font-semibold text-foreground">아직 경비가 없습니다</b>
          <span>쓴 돈을 바로 적어 두면 나중에 정산할 때 씁니다.</span>
          <Button size="sm" onClick={openNew}>
            첫 경비 추가
          </Button>
        </div>
      )}

      <ExpenseFormSheet
        tripId={tripId}
        days={days}
        people={people}
        currentUserId={currentUserId}
        expense={form.expense}
        defaultDay={form.day}
        defaultCurrency={expenses.at(-1)?.currency ?? "JPY"}
        open={form.open}
        onOpenChange={(open) => setForm((f) => ({ ...f, open }))}
      />
    </>
  );
}

function TotalsLine({ totals, className }: { totals: Totals; className?: string }) {
  const parts = usedCurrencies(totals).map((c) => formatMoney(totals[c], c));
  return <div className={"tabular-nums " + (className ?? "")}>{parts.length ? parts.join(" + ") : "0"}</div>;
}

// 쓴 외화와 이미 넣은 환율만 보여 준다. 아직 아무것도 없으면 미리 넣을 수 있게 모두 보여 준다.
function RatesPanel({ tripId, rates, used }: { tripId: string; rates: Rates; used: string[] }) {
  const shown = FOREIGN_CURRENCIES.filter((c) => used.includes(c) || rates[c] !== null);
  const list = shown.length ? shown : FOREIGN_CURRENCIES;
  return (
    <div className="flex flex-col gap-1.5 border-t pt-2">
      {list.every((c) => rates[c] === null) && (
        <p className="text-xs text-muted-foreground">환율을 넣으면 원으로 합쳐 보여 줍니다.</p>
      )}
      {list.map((c) => (
        <RateEditor key={c} tripId={tripId} currency={c} rate={rates[c]} />
      ))}
    </div>
  );
}

function RateEditor({ tripId, currency, rate }: { tripId: string; currency: ForeignCurrency; rate: number | null }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const unit = rateUnitLabel(currency);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveExchangeRate(tripId, currency, value);
      if (res.error) return setError(res.error);
      setError(null);
      setEditing(false);
    });
  };

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span className="tabular-nums">
          {unit} = {rate === null ? "환율 없음" : `${rate.toLocaleString("en-US")}원`}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setValue(rate === null ? "" : String(rate));
            setEditing(true);
          }}
        >
          {rate === null ? "환율 넣기" : "수정"}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-2">
      <label htmlFor={`exchange-rate-${currency}`} className="text-sm">
        {unit}
        {hasFinalConsonant(unit) ? "은" : "는"} 몇 원인가요?
      </label>
      <div className="flex items-center gap-2">
        <Input
          id={`exchange-rate-${currency}`}
          inputMode="decimal"
          placeholder={RATE_EXAMPLES[currency]}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <span className="text-sm">원</span>
        <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
          취소
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "저장하는 중…" : "저장"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}

// "100엔은", "1달러는"처럼 조사를 고르려고 마지막 글자의 받침을 본다.
const hasFinalConsonant = (word: string) => (word.charCodeAt(word.length - 1) - 0xac00) % 28 !== 0;

const RATE_EXAMPLES: Record<ForeignCurrency, string> = { JPY: "예: 920", USD: "예: 1,380", VND: "예: 5.4" };
