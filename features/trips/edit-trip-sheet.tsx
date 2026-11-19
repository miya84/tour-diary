"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import { deleteTrip, updateTrip } from "./actions";
import { tripInputError } from "./dates";

type TripFields = { title: string; startDate: string; endDate: string };

// 만든 사람에게만 보인다. 제목·기간을 고치고 여행을 지운다.
export function EditTripSheet({ tripId, trip }: { tripId: string; trip: TripFields }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        여행 편집
      </Button>
      <SheetContent side="bottom" className="mx-auto max-h-[92svh] max-w-xl overflow-y-auto rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>여행 편집</SheetTitle>
        </SheetHeader>
        {/* 열 때마다 현재 값으로 새로 시작한다 */}
        {open && <EditForm tripId={tripId} trip={trip} onClose={() => setOpen(false)} />}
      </SheetContent>
    </Sheet>
  );
}

function EditForm({ tripId, trip, onClose }: { tripId: string; trip: TripFields; onClose: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState(trip.title);
  const [start, setStart] = useState(trip.startDate);
  const [end, setEnd] = useState(trip.endDate);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  // 새 기간이 기존 기간의 일부를 잘라 내면 옮겨짐을 미리 알린다.
  const shrinks = !!start && !!end && (start > trip.startDate || end < trip.endDate);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const invalid = tripInputError({ title, start, end });
    if (invalid) return setError(invalid);
    startTransition(async () => {
      const res = await updateTrip(tripId, { title, start, end });
      if (res.error) return setError(res.error);
      router.refresh();
      onClose();
    });
  };

  const remove = () =>
    startTransition(async () => {
      // 성공하면 서버가 내 여행 목록으로 보낸다.
      const res = await deleteTrip(tripId);
      if (res?.error) {
        setError(res.error);
        setConfirmingDelete(false);
      }
    });

  return (
    <div className="flex flex-col gap-6 px-4 pb-6">
      <form onSubmit={save} noValidate className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="edit-trip-title">제목</Label>
          <Input id="edit-trip-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="edit-trip-start">시작일</Label>
            <Input id="edit-trip-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-trip-end">종료일</Label>
            <Input id="edit-trip-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        {shrinks && (
          <p className="text-sm text-muted-foreground">
            기간 밖의 일정·경비·투표는 가까운 끝 날짜로 옮겨집니다. 일정은 그날 맨 끝에 원래 순서대로 붙습니다.
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && !confirmingDelete ? "저장하는 중…" : "저장"}
          </Button>
        </div>
      </form>

      <section className="flex flex-col gap-3 border-t pt-4">
        <h3 className="text-sm font-semibold">여행 삭제</h3>
        {confirmingDelete ? (
          <>
            <p className="text-sm">
              <b>{trip.title}</b>을(를) 삭제할까요? 일정, 예약과 첨부 이미지, 경비, 정산, 투표, 멤버가 모두 사라지고 되돌릴 수 없습니다.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" disabled={pending} onClick={() => setConfirmingDelete(false)}>
                취소
              </Button>
              <Button variant="destructive" disabled={pending} onClick={remove}>
                {pending ? "삭제하는 중…" : "정말 삭제"}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">이 여행의 모든 기록이 지워집니다.</p>
            <Button variant="outline" onClick={() => setConfirmingDelete(true)}>
              여행 삭제
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
