"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import { deleteBooking } from "./actions";
import { BookingFormSheet } from "./booking-form-sheet";
import { kindLabel } from "./bookings";
import type { Booking } from "./types";

export function BookingsView({ tripId, bookings }: { tripId: string; bookings: Booking[] }) {
  const router = useRouter();
  const [form, setForm] = useState<{ open: boolean; booking: Booking | null }>({ open: false, booking: null });
  const [detailId, setDetailId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const detail = bookings.find((b) => b.id === detailId) ?? null;

  const remove = (booking: Booking) =>
    startTransition(async () => {
      const res = await deleteBooking(tripId, booking.id);
      if (res.error) return setError(res.error);
      setError(null);
      setConfirmingDelete(false);
      setDetailId(null);
      router.refresh();
    });

  const openDetail = (id: string | null) => {
    setDetailId(id);
    setConfirmingDelete(false);
    setError(null);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">예약함</h2>
        <Button size="sm" onClick={() => setForm({ open: true, booking: null })}>
          ＋ 예약 추가
        </Button>
      </div>

      {bookings.length ? (
        <ul className="flex flex-col gap-2">
          {bookings.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => openDetail(b.id)}
                className="grid w-full grid-cols-[auto_1fr] items-center gap-3 rounded-2xl bg-card p-3 text-left ring-1 ring-foreground/10"
              >
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">{kindLabel(b.kind)}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{b.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {[b.bookingDate?.replaceAll("-", ". "), b.attachments.length ? `이미지 ${b.attachments.length}` : null].filter(Boolean).join(" · ") ||
                      "날짜 없음"}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          <b className="text-[15px] font-semibold text-foreground">아직 예약이 없습니다</b>
          <span>QR 티켓과 예약 확인 메일을 여기에 모아 두세요.</span>
          <Button size="sm" onClick={() => setForm({ open: true, booking: null })}>
            첫 예약 추가
          </Button>
        </div>
      )}

      <Sheet open={!!detail} onOpenChange={(o) => !o && openDetail(null)}>
        <SheetContent side="bottom" className="mx-auto max-h-[92svh] max-w-xl overflow-y-auto rounded-t-3xl">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle>{detail.title}</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 px-4 pb-6">
                <p className="text-sm text-muted-foreground">
                  {[kindLabel(detail.kind), detail.bookingDate?.replaceAll("-", ". ")].filter(Boolean).join(" · ")}
                </p>
                {detail.attachments.map((a) => (
                  <button key={a.id} type="button" onClick={() => setZoom(a.url)} aria-label="이미지 확대">
                    {/* 서명된 임시 주소라 next/image 최적화를 쓰지 않는다 */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.url} alt={`${detail.title} 첨부`} className="w-full rounded-xl bg-muted object-contain" />
                  </button>
                ))}
                {detail.reference && (
                  <div className="text-sm">
                    <div className="text-xs text-muted-foreground">예약 번호</div>
                    <div className="font-mono text-base font-semibold">{detail.reference}</div>
                  </div>
                )}
                {detail.note && <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{detail.note}</p>}
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex justify-end gap-2">
                  {confirmingDelete ? (
                    <>
                      <Button variant="outline" disabled={pending} onClick={() => setConfirmingDelete(false)}>
                        취소
                      </Button>
                      <Button variant="destructive" disabled={pending} onClick={() => remove(detail)}>
                        정말 삭제
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => setConfirmingDelete(true)}>
                        삭제
                      </Button>
                      <Button
                        onClick={() => {
                          setForm({ open: true, booking: detail });
                          openDetail(null);
                        }}
                      >
                        수정
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <BookingFormSheet tripId={tripId} booking={form.booking} open={form.open} onOpenChange={(open) => setForm((f) => ({ ...f, open }))} />

      {zoom && (
        <div role="dialog" aria-label="이미지 확대" className="fixed inset-0 z-[60] flex flex-col bg-black/90 p-3">
          <Button className="self-end" variant="secondary" size="sm" onClick={() => setZoom(null)}>
            닫기
          </Button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="확대한 첨부 이미지" className="min-h-0 flex-1 object-contain" onClick={() => setZoom(null)} />
        </div>
      )}
    </>
  );
}
