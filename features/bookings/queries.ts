import "server-only";

import { createClient } from "@/lib/supabase/server";

import { sortBookings } from "./bookings";
import type { Booking } from "./types";

const SIGNED_URL_SECONDS = 60 * 60;

// 멤버만 읽을 수 있다(RLS). 첨부는 한 시간짜리 임시 주소로 보여 준다.
export async function listBookings(tripId: string): Promise<Booking[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, kind, title, booking_date, reference, note, created_at, booking_attachments(id, path, created_at)")
    .eq("trip_id", tripId);
  if (error) throw error;

  const paths = data.flatMap((b) => b.booking_attachments.map((a) => a.path));
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data: signed, error: signError } = await supabase.storage
      .from("booking-attachments")
      .createSignedUrls(paths, SIGNED_URL_SECONDS);
    if (signError) throw signError;
    for (const s of signed) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
  }

  return sortBookings(
    data.map((b) => ({
      id: b.id,
      kind: b.kind as Booking["kind"],
      title: b.title,
      bookingDate: b.booking_date,
      reference: b.reference,
      note: b.note,
      createdAt: b.created_at,
      attachments: [...b.booking_attachments]
        .sort((x, y) => (x.created_at < y.created_at ? -1 : 1))
        .flatMap((a) => (urls.has(a.path) ? [{ id: a.id, path: a.path, url: urls.get(a.path)! }] : [])),
    })),
  );
}
