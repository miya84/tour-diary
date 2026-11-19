"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import { copyTrip } from "./actions";
import { copiedEndDate, tripPeriodLabel } from "./dates";

type Source = { id: string; title: string; startDate: string; endDate: string };

// 여행의 일정을 내 새 여행으로 복사한다. 시작일만 정하면 같은 길이로 만들어진다.
export function CopyTripSheet({ trip, variant = "outline" }: { trip: Source; variant?: "outline" | "ghost" }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button size="sm" variant={variant} onClick={() => setOpen(true)}>
        복사하기
      </Button>
      <SheetContent side="bottom" className="mx-auto max-h-[92svh] max-w-xl overflow-y-auto rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>여행 복사하기</SheetTitle>
        </SheetHeader>
        {open && <CopyForm trip={trip} onClose={() => setOpen(false)} />}
      </SheetContent>
    </Sheet>
  );
}

function CopyForm({ trip, onClose }: { trip: Source; onClose: () => void }) {
  const [title, setTitle] = useState(`${trip.title} 복사본`);
  const [start, setStart] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const end = copiedEndDate(trip.startDate, trip.endDate, start);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError("제목을 입력해 주세요.");
    if (!start) return setError("시작일을 정해 주세요.");
    startTransition(async () => {
      // 성공하면 서버가 새 여행 화면으로 보낸다.
      const res = await copyTrip(trip.id, { title, start });
      if (res?.error) setError(res.error);
    });
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 px-4 pb-6">
      <p className="text-sm text-muted-foreground">
        <b className="text-foreground">{trip.title}</b>({tripPeriodLabel(trip.startDate, trip.endDate)})의 일정을 새 여행으로 가져옵니다. 예약, 경비, 투표,
        멤버는 복사하지 않습니다.
      </p>
      <div className="grid gap-2">
        <Label htmlFor="copy-trip-title">제목</Label>
        <Input id="copy-trip-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="copy-trip-start">시작일</Label>
        <Input id="copy-trip-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        {end && <p className="text-sm text-muted-foreground">{tripPeriodLabel(start, end)}로 만들어집니다.</p>}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
          취소
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "복사하는 중…" : "복사하기"}
        </Button>
      </div>
    </form>
  );
}
