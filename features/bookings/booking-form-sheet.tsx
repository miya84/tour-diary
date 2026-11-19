"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import { removeAttachment, saveBooking } from "./actions";
import { ATTACHMENT_MAX_COUNT, ATTACHMENT_TYPES, validateAttachments } from "./attachments";
import { BOOKING_KINDS, type BookingKind } from "./bookings";
import type { Booking } from "./types";
import { uploadAttachments } from "./upload";

export function BookingFormSheet({
  tripId,
  booking,
  open,
  onOpenChange,
}: {
  tripId: string;
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[92svh] max-w-xl overflow-y-auto rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>{booking ? "예약 수정" : "예약 추가"}</SheetTitle>
        </SheetHeader>
        {open && <BookingForm key={booking?.id ?? "new"} tripId={tripId} booking={booking} onClose={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  );
}

function BookingForm({ tripId, booking, onClose }: { tripId: string; booking: Booking | null; onClose: () => void }) {
  const router = useRouter();
  const [kind, setKind] = useState<BookingKind | "">(booking?.kind ?? "");
  const [title, setTitle] = useState(booking?.title ?? "");
  const [bookingDate, setBookingDate] = useState(booking?.bookingDate ?? "");
  const [reference, setReference] = useState(booking?.reference ?? "");
  const [note, setNote] = useState(booking?.note ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [attachments, setAttachments] = useState(booking?.attachments ?? []);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const addFiles = (picked: FileList | null) => {
    if (!picked?.length) return;
    const next = [...files, ...picked];
    const message = validateAttachments(attachments.length, next);
    if (message) return setError(message);
    setError(null);
    setFiles(next);
  };

  const dropAttachment = (id: string) =>
    startTransition(async () => {
      const res = await removeAttachment(tripId, id);
      if (res.error) return setError(res.error);
      setAttachments((list) => list.filter((a) => a.id !== id));
      router.refresh();
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError("제목을 입력해 주세요.");
    if (!kind) return setError("종류를 골라 주세요.");
    startTransition(async () => {
      const res = await saveBooking(tripId, { kind, title, bookingDate, reference, note }, booking?.id);
      if (res.error || !res.id) return setError(res.error ?? "예약을 저장하지 못했습니다.");
      if (files.length) {
        const uploadError = await uploadAttachments(tripId, res.id, files);
        if (uploadError) {
          setError(uploadError);
          router.refresh();
          return;
        }
      }
      router.refresh();
      onClose();
    });
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 px-4 pb-6">
      <div className="grid gap-2">
        <Label>종류</Label>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="종류">
          {BOOKING_KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              role="radio"
              aria-checked={kind === k.value}
              onClick={() => setKind(k.value)}
              className={
                "rounded-full border px-3 py-1 text-sm " +
                (kind === k.value ? "border-primary bg-primary text-primary-foreground" : "border-border")
              }
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="booking-title">제목</Label>
        <Input id="booking-title" placeholder="예: 인천 → 후쿠오카 항공권" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="booking-date">날짜 (선택)</Label>
          <Input id="booking-date" type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="booking-ref">예약 번호 (선택)</Label>
          <Input id="booking-ref" value={reference} onChange={(e) => setReference(e.target.value)} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="booking-note">메모 (선택)</Label>
        <Textarea
          id="booking-note"
          rows={4}
          maxLength={5000}
          placeholder="예약 확인 메일 본문을 붙여 넣어도 됩니다."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="booking-files">첨부 이미지 (선택)</Label>
        <Input
          id="booking-files"
          type="file"
          accept={ATTACHMENT_TYPES.join(",")}
          multiple
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="text-sm text-muted-foreground">JPG·PNG·WebP, 파일당 10MB 이하, 예약당 최대 {ATTACHMENT_MAX_COUNT}개.</p>
        {(attachments.length > 0 || files.length > 0) && (
          <ul className="flex flex-col gap-1 text-sm">
            {attachments.map((a, i) => (
              <li key={a.id} className="flex items-center justify-between gap-2">
                <span>저장된 이미지 {i + 1}</span>
                <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => dropAttachment(a.id)}>
                  빼기
                </Button>
              </li>
            ))}
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate">{f.name}</span>
                <Button type="button" size="sm" variant="ghost" onClick={() => setFiles((list) => list.filter((_, j) => j !== i))}>
                  빼기
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "저장하는 중…" : "저장"}
      </Button>
    </form>
  );
}
