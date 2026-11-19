"use server";

import { revalidatePath } from "next/cache";

import { createClient, getCurrentUser } from "@/lib/supabase/server";

import { isValidRange } from "./dates";

export type CreateTripState = { error?: string; ok?: boolean };

export async function createTrip(_prev: CreateTripState, formData: FormData): Promise<CreateTripState> {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const title = String(formData.get("title") ?? "").trim();
  const start = String(formData.get("start") ?? "");
  const end = String(formData.get("end") ?? "");
  if (!title) return { error: "제목을 입력해 주세요." };
  if (!start || !end) return { error: "시작일과 종료일을 모두 정해 주세요." };
  if (!isValidRange(start, end)) return { error: "종료일은 시작일보다 빠를 수 없습니다." };

  const supabase = await createClient();
  const { error } = await supabase.from("trips").insert({ title, start_date: start, end_date: end });
  if (error) return { error: "여행을 만들지 못했습니다. 잠시 후 다시 시도해 주세요." };

  revalidatePath("/");
  return { ok: true };
}
