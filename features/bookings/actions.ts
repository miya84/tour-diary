"use server";

import { revalidatePath } from "next/cache";

import { createClient, getCurrentUser } from "@/lib/supabase/server";

import { BOOKING_KINDS, type BookingKind } from "./bookings";
import type { BookingInput } from "./types";

type Result = { error?: string; id?: string };

async function authed() {
  const user = await getCurrentUser();
  if (!user) throw new Error("로그인이 필요합니다.");
  return createClient();
}

function columns(input: BookingInput) {
  return {
    kind: input.kind as BookingKind,
    title: input.title.trim(),
    booking_date: input.bookingDate || null,
    reference: input.reference.trim() || null,
    note: input.note.trim() || null,
  };
}

function invalid(input: BookingInput): string | null {
  if (!input.title.trim()) return "제목을 입력해 주세요.";
  if (!BOOKING_KINDS.some((k) => k.value === input.kind)) return "종류를 골라 주세요.";
  if (input.note.length > 5000) return "메모는 5,000자까지 쓸 수 있습니다.";
  return null;
}

export async function saveBooking(tripId: string, input: BookingInput, bookingId?: string): Promise<Result> {
  const message = invalid(input);
  if (message) return { error: message };
  const supabase = await authed();

  if (bookingId) {
    const { error, count } = await supabase
      .from("bookings")
      .update(columns(input), { count: "exact" })
      .eq("id", bookingId)
      .eq("trip_id", tripId);
    if (error || count === 0) return { error: "예약을 저장하지 못했습니다." };
    revalidatePath(`/trips/${tripId}`);
    return { id: bookingId };
  }

  const { data, error } = await supabase.from("bookings").insert({ trip_id: tripId, ...columns(input) }).select("id").single();
  if (error) return { error: "예약을 저장하지 못했습니다." };
  revalidatePath(`/trips/${tripId}`);
  return { id: data.id };
}

// 첨부 파일을 먼저 지우고 예약을 지운다(첨부 행은 예약과 함께 사라진다).
export async function deleteBooking(tripId: string, bookingId: string): Promise<Result> {
  const supabase = await authed();
  const { data: files } = await supabase.from("booking_attachments").select("path").eq("booking_id", bookingId);
  if (files?.length) {
    const { error } = await supabase.storage.from("booking-attachments").remove(files.map((f) => f.path));
    if (error) return { error: "첨부 파일을 지우지 못했습니다." };
  }
  const { error, count } = await supabase.from("bookings").delete({ count: "exact" }).eq("id", bookingId).eq("trip_id", tripId);
  if (error || count === 0) return { error: "예약을 지우지 못했습니다." };
  revalidatePath(`/trips/${tripId}`);
  return {};
}

export async function removeAttachment(tripId: string, attachmentId: string): Promise<Result> {
  const supabase = await authed();
  const { data } = await supabase.from("booking_attachments").select("path").eq("id", attachmentId).maybeSingle();
  if (!data) return { error: "첨부를 찾지 못했습니다." };
  const { error: fileError } = await supabase.storage.from("booking-attachments").remove([data.path]);
  if (fileError) return { error: "첨부 파일을 지우지 못했습니다." };
  const { error } = await supabase.from("booking_attachments").delete().eq("id", attachmentId);
  if (error) return { error: "첨부를 지우지 못했습니다." };
  revalidatePath(`/trips/${tripId}`);
  return {};
}
