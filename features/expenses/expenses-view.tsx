"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dayLabel } from "@/features/trips/dates";

import { saveExchangeRate } from "./actions";
import { ExpenseFormSheet } from "./expense-form-sheet";
import { defaultExpenseDay, formatMoney, summarize, type Totals } from "./expenses";
import type { Expense, ExpensePerson } from "./types";

export function ExpensesView({
  tripId,
  days,
  people,
  currentUserId,
  expenses,
  krwPer100Jpy,
}: {
  tripId: string;
  days: string[];
  people: ExpensePerson[];
  currentUserId: string;
  expenses: Expense[];
  krwPer100Jpy: number | null;
}) {
  const [form, setForm] = useState<{ open: boolean; expense: Expense | null; day: string }>({ open: false, expense: null, day: days[0] });
  const { days: groups, total, totalInKrw } = summarize(expenses, krwPer100Jpy);
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

      <section className="flex flex-col gap-2 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="text-xs text-muted-foreground">전체 합계</div>
        <TotalsLine totals={total} className="text-lg font-semibold" />
        {totalInKrw !== null && <div className="text-sm">원으로 합치면 약 {formatMoney(totalInKrw, "KRW")}</div>}
        <RateEditor tripId={tripId} rate={krwPer100Jpy} />
      </section>

      {groups.length ? (
        groups.map((g) => (
          <section key={g.day} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold">{dayLabel(g.day).full}</h3>
              <TotalsLine totals={g.totals} className="text-sm text-muted-foreground" />
            </div>
            <ul className="flex flex-col gap-2">
              {expenses
                .filter((e) => e.spentOn === g.day)
                .map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => setForm({ open: true, expense: e, day: e.spentOn })}
                      className="grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-2xl bg-card p-3 text-left ring-1 ring-foreground/10"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{e.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {nickname(e.paidBy)} 냄 · {e.shareUserIds.length}명이 나눔
                        </span>
                      </span>
                      <span className="text-sm font-semibold tabular-nums">{formatMoney(e.amount, e.currency)}</span>
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        ))
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
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
        open={form.open}
        onOpenChange={(open) => setForm((f) => ({ ...f, open }))}
      />
    </>
  );
}

function TotalsLine({ totals, className }: { totals: Totals; className?: string }) {
  const parts = [totals.JPY ? formatMoney(totals.JPY, "JPY") : null, totals.KRW ? formatMoney(totals.KRW, "KRW") : null].filter(Boolean);
  return <div className={"tabular-nums " + (className ?? "")}>{parts.length ? parts.join(" + ") : "0"}</div>;
}

function RateEditor({ tripId, rate }: { tripId: string; rate: number | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveExchangeRate(tripId, value);
      if (res.error) return setError(res.error);
      setError(null);
      setEditing(false);
      router.refresh();
    });
  };

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-2 border-t pt-2 text-sm text-muted-foreground">
        <span>{rate === null ? "환율을 넣으면 원으로 합쳐 보여 줍니다." : `환율 100엔 = ${rate.toLocaleString("en-US")}원`}</span>
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
    <form onSubmit={save} noValidate className="flex flex-col gap-2 border-t pt-2">
      <label htmlFor="exchange-rate" className="text-sm">
        100엔은 몇 원인가요?
      </label>
      <div className="flex items-center gap-2">
        <Input id="exchange-rate" inputMode="decimal" placeholder="예: 920" value={value} onChange={(e) => setValue(e.target.value)} />
        <span className="text-sm">원</span>
        <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
          취소
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          저장
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
