"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { dayLabel } from "@/features/trips/dates";

import { addItem, deleteItem, updateItem } from "./actions";
import { PlaceSearch } from "./place-search";
import type { ItineraryItem, Place } from "./types";

export function ItemSheet({
  tripId,
  days,
  item,
  defaultDay,
  open,
  onOpenChange,
  onSaved,
}: {
  tripId: string;
  days: string[];
  item: ItineraryItem | null;
  defaultDay: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (day: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[92svh] max-w-xl overflow-y-auto rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>{item ? "일정 수정" : "일정 추가"}</SheetTitle>
        </SheetHeader>
        {/* 열 때마다 입력값을 새로 시작한다 */}
        {open && <ItemForm key={item?.id ?? "new"} tripId={tripId} days={days} item={item} defaultDay={defaultDay} onClose={() => onOpenChange(false)} onSaved={onSaved} />}
      </SheetContent>
    </Sheet>
  );
}

function ItemForm({
  tripId,
  days,
  item,
  defaultDay,
  onClose,
  onSaved,
}: {
  tripId: string;
  days: string[];
  item: ItineraryItem | null;
  defaultDay: string;
  onClose: () => void;
  onSaved: (day: string) => void;
}) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [place, setPlace] = useState<Place | null>(item?.place ?? null);
  const [startTime, setStartTime] = useState(item?.startTime ?? "");
  const [day, setDay] = useState(item?.day ?? defaultDay);
  const [note, setNote] = useState(item?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("제목을 입력해 주세요.");
      return;
    }
    const input = { title, place, startTime, day, note };
    startTransition(async () => {
      const res = item ? await updateItem(tripId, item.id, input, item.day) : await addItem(tripId, input);
      if (res.error) return setError(res.error);
      onSaved(day);
      onClose();
    });
  };

  const remove = () =>
    startTransition(async () => {
      const res = await deleteItem(tripId, item!.id);
      if (res.error) return setError(res.error);
      onClose();
    });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 px-4 pb-6">
      <div className="grid gap-2">
        <Label htmlFor="item-title">제목</Label>
        <Input id="item-title" placeholder="예: 기린코 호수 산책" value={title} aria-invalid={error && !title.trim() ? true : undefined} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="item-place">
          장소 <span className="font-normal text-muted-foreground">선택</span>
        </Label>
        <PlaceSearch value={place} onChange={setPlace} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="item-time">
            시작 시간 <span className="font-normal text-muted-foreground">선택</span>
          </Label>
          <Input id="item-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="item-day">날짜</Label>
          <select
            id="item-day"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="h-9 rounded-4xl border border-input bg-input/30 px-3 text-sm"
          >
            {days.map((d) => (
              <option key={d} value={d}>
                {dayLabel(d).short} ({dayLabel(d).weekday})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="item-note">
          메모 <span className="font-normal text-muted-foreground">선택</span>
        </Label>
        <Textarea id="item-note" placeholder="예약 번호, 먹을 것, 주의할 점" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center gap-2">
        {item && (
          <Button type="button" variant="destructive" disabled={pending} onClick={remove}>
            삭제
          </Button>
        )}
        <span className="flex-1" />
        <Button type="button" variant="outline" onClick={onClose}>
          취소
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "저장하는 중…" : "저장"}
        </Button>
      </div>
    </form>
  );
}
