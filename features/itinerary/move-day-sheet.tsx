"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { dayLabel } from "@/features/trips/dates";
import { useCloseWhenDone } from "@/lib/use-close-when-done";

import { swapDays } from "./actions";
import { moveDayCounts } from "./days";

function spoken(day: string) {
  const [, m, d] = day.split("-").map(Number);
  return `${m}월 ${d}일`;
}

// 한 날의 일정을 다른 날로 통째로 옮긴다. 대상 날짜에 일정이 있으면 서로 바뀐다.
export function MoveDaySheet({
  tripId,
  days,
  items,
  fromDay,
  lockedBy,
  open,
  onOpenChange,
  onMoved,
}: {
  tripId: string;
  days: string[];
  items: { day: string }[];
  fromDay: string;
  // 다른 멤버가 그 날짜의 순서를 변경 중이면 그 이름
  lockedBy: (day: string) => string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMoved: (day: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[92svh] max-w-xl overflow-y-auto rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>{spoken(fromDay)} 일정 옮기기</SheetTitle>
        </SheetHeader>
        {open && (
          <MoveForm
            key={fromDay}
            tripId={tripId}
            days={days}
            items={items}
            fromDay={fromDay}
            lockedBy={lockedBy}
            onClose={() => onOpenChange(false)}
            onMoved={onMoved}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function MoveForm({
  tripId,
  days,
  items,
  fromDay,
  lockedBy,
  onClose,
  onMoved,
}: {
  tripId: string;
  days: string[];
  items: { day: string }[];
  fromDay: string;
  lockedBy: (day: string) => string | null;
  onClose: () => void;
  onMoved: (day: string) => void;
}) {
  const [target, setTarget] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { finish, waiting } = useCloseWhenDone(pending, onClose);

  const counts = target ? moveDayCounts(items, fromDay, target) : null;
  // "12월 23일"처럼 받침 있는 말로 끝나게 써서 조사(은·로·의)가 자연스럽게 붙는다.
  const from = spoken(fromDay);
  const to = target ? spoken(target) : "";
  const blocker = lockedBy(fromDay) ?? (target ? lockedBy(target) : null);

  const submit = () => {
    if (!target) return;
    startTransition(async () => {
      const res = await swapDays(tripId, fromDay, target);
      if (res.error) return setError(res.error);
      onMoved(target);
      finish();
    });
  };

  return (
    <div className="flex flex-col gap-4 px-4 pb-6">
      <p className="text-sm text-muted-foreground">옮길 날짜를 고르세요. 그날에 일정이 있으면 서로 바뀝니다.</p>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="옮길 날짜">
        {days
          .filter((d) => d !== fromDay)
          .map((d) => {
            const l = dayLabel(d);
            const holder = lockedBy(d);
            return (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={target === d}
                disabled={!!holder}
                onClick={() => {
                  setTarget(d);
                  setError(null);
                }}
                className={
                  "rounded-full border px-3 py-1 text-sm disabled:opacity-50 " +
                  (target === d ? "border-primary bg-primary text-primary-foreground" : "border-border")
                }
              >
                {l.short} ({l.weekday})
                {holder && <span className="ml-1 text-xs">· {holder}님이 순서 변경 중</span>}
              </button>
            );
          })}
      </div>
      {counts && (
        <p className="text-sm">
          {from}의 일정 {counts.moving}개를 {to}로 옮깁니다.{" "}
          {counts.swapping ? `${to}의 일정 ${counts.swapping}개는 ${from}로 갑니다.` : `${to}은 비어 있어 일정만 옮겨집니다.`}
        </p>
      )}
      {blocker && !target && <p className="text-sm text-muted-foreground">{blocker}님이 순서 변경 중이라 지금은 옮길 수 없습니다.</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="outline" disabled={waiting} onClick={onClose}>
          취소
        </Button>
        <Button disabled={!target || waiting} onClick={submit}>
          {waiting ? "옮기는 중…" : "옮기기"}
        </Button>
      </div>
    </div>
  );
}
