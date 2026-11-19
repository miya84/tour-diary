"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { dayLabel } from "@/features/trips/dates";
import { useCloseWhenDone } from "@/lib/use-close-when-done";

import { deleteExpense, saveExpense } from "./actions";
import { CURRENCIES, type Currency, validateExpense } from "./expenses";
import type { Expense, ExpensePerson } from "./types";

type Props = {
  tripId: string;
  days: string[];
  people: ExpensePerson[];
  currentUserId: string;
  expense: Expense | null;
  defaultDay: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ExpenseFormSheet({ open, onOpenChange, expense, ...rest }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[92svh] max-w-xl overflow-y-auto rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>{expense ? "경비 수정" : "경비 추가"}</SheetTitle>
        </SheetHeader>
        {/* 열 때마다 입력값을 새로 시작한다 */}
        {open && <ExpenseForm key={expense?.id ?? "new"} expense={expense} onClose={() => onOpenChange(false)} {...rest} />}
      </SheetContent>
    </Sheet>
  );
}

function ExpenseForm({
  tripId,
  days,
  people,
  currentUserId,
  expense,
  defaultDay,
  onClose,
}: Omit<Props, "open" | "onOpenChange"> & { onClose: () => void }) {
  const [title, setTitle] = useState(expense?.title ?? "");
  const [amount, setAmount] = useState(expense ? expense.amount.toLocaleString("en-US") : "");
  const [currency, setCurrency] = useState<Currency>(expense?.currency ?? "JPY");
  const [paidBy, setPaidBy] = useState(expense?.paidBy ?? currentUserId);
  const [shareUserIds, setShareUserIds] = useState<string[]>(
    expense ? expense.shareUserIds.filter((id) => people.some((p) => p.userId === id)) : people.map((p) => p.userId),
  );
  const [spentOn, setSpentOn] = useState(expense?.spentOn ?? defaultDay);
  const [note, setNote] = useState(expense?.note ?? "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { finish, waiting } = useCloseWhenDone(pending, onClose);

  const toggleShare = (id: string) =>
    setShareUserIds((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = validateExpense({ title, amount, shareUserIds });
    if (message) return setError(message);
    startTransition(async () => {
      const res = await saveExpense(tripId, { title, amount, currency, paidBy, spentOn, note, shareUserIds }, expense?.id);
      if (res.error) return setError(res.error);
      finish();
    });
  };

  const remove = () =>
    startTransition(async () => {
      const res = await deleteExpense(tripId, expense!.id);
      if (res.error) return setError(res.error);
      finish();
    });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 px-4 pb-6">
      <div className="grid gap-2">
        <Label htmlFor="expense-title">내용</Label>
        <Input id="expense-title" placeholder="예: 이치란 라멘" maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="grid grid-cols-[1fr_auto] items-end gap-3">
        <div className="grid gap-2">
          <Label htmlFor="expense-amount">금액</Label>
          <Input
            id="expense-amount"
            inputMode="numeric"
            placeholder="예: 2,980"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <Chips label="통화" options={CURRENCIES.map((c) => ({ id: c.value, label: c.label }))} selected={[currency]} onToggle={(id) => setCurrency(id as Currency)} />
      </div>
      <div className="grid gap-2">
        <Label>낸 사람</Label>
        <Chips label="낸 사람" options={people.map((p) => ({ id: p.userId, label: p.nickname }))} selected={[paidBy]} onToggle={setPaidBy} />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label>
            나눌 사람 <span className="font-normal text-muted-foreground">{shareUserIds.length}명</span>
          </Label>
          <Button type="button" size="sm" variant="ghost" onClick={() => setShareUserIds(people.map((p) => p.userId))}>
            전원
          </Button>
        </div>
        <Chips label="나눌 사람" multiple options={people.map((p) => ({ id: p.userId, label: p.nickname }))} selected={shareUserIds} onToggle={toggleShare} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="expense-day">날짜</Label>
        <select
          id="expense-day"
          value={spentOn}
          onChange={(e) => setSpentOn(e.target.value)}
          className="h-9 rounded-4xl border border-input bg-input/30 px-3 text-sm"
        >
          {/* 여행 날짜를 바꿔 기간 밖이 된 경비도 원래 날짜를 지킨다 */}
          {(days.includes(spentOn) ? days : [spentOn, ...days]).map((d) => (
            <option key={d} value={d}>
              {dayLabel(d).short} ({dayLabel(d).weekday})
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="expense-note">
          메모 <span className="font-normal text-muted-foreground">선택</span>
        </Label>
        <Textarea id="expense-note" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center gap-2">
        {expense &&
          (confirmingDelete ? (
            <>
              <Button type="button" variant="outline" disabled={waiting} onClick={() => setConfirmingDelete(false)}>
                취소
              </Button>
              <Button type="button" variant="destructive" disabled={waiting} onClick={remove}>
                정말 삭제
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" onClick={() => setConfirmingDelete(true)}>
              삭제
            </Button>
          ))}
        <span className="flex-1" />
        <Button type="submit" disabled={waiting}>
          {waiting ? "저장하는 중…" : "저장"}
        </Button>
      </div>
    </form>
  );
}

function Chips({
  label,
  options,
  selected,
  onToggle,
  multiple,
}: {
  label: string;
  options: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  multiple?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role={multiple ? "group" : "radiogroup"} aria-label={label}>
      {options.map((o) => {
        const on = selected.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            role={multiple ? "checkbox" : "radio"}
            aria-checked={on}
            onClick={() => onToggle(o.id)}
            className={
              "h-9 max-w-40 truncate rounded-full border px-3 text-sm " +
              (on ? "border-primary bg-primary text-primary-foreground" : "border-border")
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
