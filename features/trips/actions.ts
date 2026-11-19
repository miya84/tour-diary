"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient, getCurrentUser } from "@/lib/supabase/server";

import { tripInputError } from "./dates";

export type CreateTripState = { error?: string; ok?: boolean };

export async function createTrip(_prev: CreateTripState, formData: FormData): Promise<CreateTripState> {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const title = String(formData.get("title") ?? "").trim();
  const start = String(formData.get("start") ?? "");
  const end = String(formData.get("end") ?? "");
  const invalid = tripInputError({ title, start, end });
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { error } = await supabase.from("trips").insert({ title, start_date: start, end_date: end });
  if (error) return { error: "여행을 만들지 못했습니다. 잠시 후 다시 시도해 주세요." };

  revalidatePath("/");
  return { ok: true };
}

type Result = { error?: string };

const UPDATE_ERRORS: Record<string, string> = {
  not_owner: "여행을 만든 사람만 고칠 수 있습니다.",
  invalid_title: "제목을 입력해 주세요.",
  invalid_range: "종료일은 시작일보다 빠를 수 없습니다.",
};

// 제목과 기간을 고친다. 기간 밖에 놓인 일정·경비·투표를 옮기는 일까지 update_trip 함수가 한 번에 한다.
export async function updateTrip(tripId: string, input: { title: string; start: string; end: string }): Promise<Result> {
  const invalid = tripInputError(input);
  if (invalid) return { error: invalid };
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_trip", { p_trip_id: tripId, p_title: input.title, p_start: input.start, p_end: input.end });
  if (error) return { error: UPDATE_ERRORS[error.message] ?? "여행을 저장하지 못했습니다." };

  revalidatePath("/");
  revalidatePath(`/trips/${tripId}`);
  return {};
}

// 예약 첨부 파일을 먼저 지우고 여행을 지운다(나머지 데이터는 여행과 함께 사라진다). 파일 삭제가 실패하면 여행은 그대로 둔다.
export async function deleteTrip(tripId: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };
  const supabase = await createClient();

  const { data: trip } = await supabase.from("trips").select("user_id").eq("id", tripId).maybeSingle();
  if (!trip) return { error: "여행을 찾지 못했습니다." };
  if (trip.user_id !== user.id) return { error: "여행을 만든 사람만 지울 수 있습니다." };

  const { data: files } = await supabase.from("booking_attachments").select("path").eq("trip_id", tripId);
  if (files?.length) {
    const { error } = await supabase.storage.from("booking-attachments").remove(files.map((f) => f.path));
    if (error) return { error: "첨부 파일을 지우지 못했습니다." };
  }

  const { error, count } = await supabase.from("trips").delete({ count: "exact" }).eq("id", tripId);
  if (error || count === 0) return { error: "여행을 지우지 못했습니다." };

  revalidatePath("/");
  redirect("/");
}
