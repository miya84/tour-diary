import { createClient } from "@/lib/supabase/client";

// 브라우저에서 바로 올린다(서버 액션은 큰 파일을 받기에 적합하지 않다). 올린 뒤 첨부 행을 남긴다.
export async function uploadAttachments(tripId: string, bookingId: string, files: File[]): Promise<string | null> {
  const supabase = createClient();
  for (const file of files) {
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${tripId}/${bookingId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("booking-attachments").upload(path, file, { contentType: file.type });
    if (error) return "이미지를 올리지 못했습니다. 예약은 저장되었으니 수정에서 다시 올려 주세요.";
    const { error: rowError } = await supabase
      .from("booking_attachments")
      .insert({ booking_id: bookingId, trip_id: tripId, path });
    if (rowError) {
      await supabase.storage.from("booking-attachments").remove([path]);
      return "이미지를 올리지 못했습니다. 예약은 저장되었으니 수정에서 다시 올려 주세요.";
    }
  }
  return null;
}
