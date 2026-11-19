"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import { createTrip, type CreateTripState } from "./actions";

export function NewTripSheet({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  // 제어 입력으로 두어, 검증 오류로 돌아와도 입력한 값이 지워지지 않게 한다.
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [state, formAction, pending] = useActionState<CreateTripState, FormData>(async (prev, formData) => {
    const result = await createTrip(prev, formData);
    if (result.ok) {
      setOpen(false);
      setTitle("");
      setStart("");
      setEnd("");
    }
    return result;
  }, {});

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <SheetContent side="bottom" className="mx-auto max-w-xl rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>새 여행 만들기</SheetTitle>
        </SheetHeader>
        <form action={formAction} noValidate className="flex flex-col gap-4 px-4 pb-6">
          <div className="grid gap-2">
            <Label htmlFor="trip-title">제목</Label>
            <Input id="trip-title" name="title" placeholder="예: 후쿠오카 12월" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="trip-start">시작일</Label>
              <Input id="trip-start" name="start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="trip-end">종료일</Label>
              <Input id="trip-end" name="end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "만드는 중…" : "만들기"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
