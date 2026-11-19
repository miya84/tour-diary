"use server";

import { revalidatePath } from "next/cache";

import { createClient, getCurrentUser } from "@/lib/supabase/server";

import type { ItemInput } from "./types";

type Result = { error?: string };

async function authed() {
  const user = await getCurrentUser();
  if (!user) throw new Error("로그인이 필요합니다.");
  return createClient();
}

function columns(input: ItemInput) {
  return {
    day: input.day,
    title: input.title.trim(),
    start_time: input.startTime || null,
    note: input.note.trim() || null,
    place_id: input.place?.placeId ?? null,
    place_name: input.place?.name ?? null,
    lat: input.place?.lat ?? null,
    lng: input.place?.lng ?? null,
  };
}

// 그날의 맨 끝 순서 값.
async function endPosition(supabase: Awaited<ReturnType<typeof createClient>>, tripId: string, day: string) {
  const { data } = await supabase
    .from("itinerary_items")
    .select("position")
    .eq("trip_id", tripId)
    .eq("day", day)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? data.position + 1 : 0;
}

export async function addItem(tripId: string, input: ItemInput): Promise<Result> {
  if (!input.title.trim()) return { error: "제목을 입력해 주세요." };
  const supabase = await authed();
  const position = await endPosition(supabase, tripId, input.day);
  const { error } = await supabase.from("itinerary_items").insert({ trip_id: tripId, position, ...columns(input) });
  if (error) return { error: "일정을 저장하지 못했습니다." };
  revalidatePath(`/trips/${tripId}`);
  return {};
}

export async function updateItem(tripId: string, id: string, input: ItemInput, previousDay: string): Promise<Result> {
  if (!input.title.trim()) return { error: "제목을 입력해 주세요." };
  const supabase = await authed();
  // 다른 날짜로 옮기면 그날의 맨 끝에 놓는다.
  const position = input.day !== previousDay ? { position: await endPosition(supabase, tripId, input.day) } : {};
  const { error, count } = await supabase
    .from("itinerary_items")
    .update({ ...columns(input), ...position }, { count: "exact" })
    .eq("id", id)
    .eq("trip_id", tripId);
  if (error || count === 0) return { error: "일정을 저장하지 못했습니다." };
  revalidatePath(`/trips/${tripId}`);
  return {};
}

export async function deleteItem(tripId: string, id: string): Promise<Result> {
  const supabase = await authed();
  const { error } = await supabase.from("itinerary_items").delete().eq("id", id).eq("trip_id", tripId);
  if (error) return { error: "일정을 지우지 못했습니다." };
  revalidatePath(`/trips/${tripId}`);
  return {};
}

export async function reorderItems(tripId: string, day: string, ids: string[]): Promise<Result> {
  const supabase = await authed();
  const { error } = await supabase.rpc("reorder_itinerary_items", { p_trip_id: tripId, p_day: day, p_ids: ids });
  if (error) return { error: "순서를 저장하지 못했습니다." };
  revalidatePath(`/trips/${tripId}`);
  return {};
}
