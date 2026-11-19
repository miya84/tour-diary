"use server";

import { revalidatePath } from "next/cache";

import type { Place } from "@/features/itinerary/types";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

import { validatePollInput } from "./polls";

type Result = { error?: string };

async function authed() {
  const user = await getCurrentUser();
  if (!user) throw new Error("로그인이 필요합니다.");
  return { supabase: await createClient(), user };
}

function daysBetween(start: string, end: string) {
  const days: string[] = [];
  for (let d = new Date(`${start}T00:00:00Z`); d.toISOString().slice(0, 10) <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export async function createPoll(tripId: string, input: { question: string; day: string }): Promise<Result> {
  const { supabase } = await authed();
  const { data: trip } = await supabase.from("trips").select("start_date, end_date").eq("id", tripId).maybeSingle();
  if (!trip) return { error: "여행을 찾지 못했습니다." };
  const message = validatePollInput(input, daysBetween(trip.start_date, trip.end_date));
  if (message) return { error: message };
  const { error } = await supabase.from("polls").insert({ trip_id: tripId, question: input.question.trim(), day: input.day });
  if (error) return { error: "투표를 만들지 못했습니다." };
  revalidatePath(`/trips/${tripId}`);
  return {};
}

export async function addOption(tripId: string, pollId: string, input: { title: string; place: Place | null }): Promise<Result> {
  const title = input.title.trim();
  if (!title) return { error: "후보 이름을 입력해 주세요." };
  if (title.length > 100) return { error: "후보 이름은 100자까지 쓸 수 있습니다." };
  const { supabase } = await authed();
  const { error } = await supabase.from("poll_options").insert({
    poll_id: pollId,
    trip_id: tripId,
    title,
    place_id: input.place?.placeId ?? null,
    place_name: input.place?.name ?? null,
    lat: input.place?.lat ?? null,
    lng: input.place?.lng ?? null,
  });
  if (error) return { error: "후보를 올리지 못했습니다. 이미 마감된 투표일 수 있습니다." };
  revalidatePath(`/trips/${tripId}`);
  return {};
}

// 한 사람에 한 행(poll_id, user_id)이라 같은 호출로 처음 던지기와 옮기기를 모두 처리한다.
export async function castVote(tripId: string, pollId: string, optionId: string): Promise<Result> {
  const { supabase, user } = await authed();
  const { error } = await supabase
    .from("poll_votes")
    .upsert({ poll_id: pollId, user_id: user.id, option_id: optionId, updated_at: new Date().toISOString() }, { onConflict: "poll_id,user_id" });
  if (error) return { error: "투표하지 못했습니다. 이미 마감된 투표일 수 있습니다." };
  revalidatePath(`/trips/${tripId}`);
  return {};
}

const CLOSE_ERRORS: Record<string, string> = {
  poll_closed: "이미 마감된 투표입니다.",
  no_options: "후보가 없어 마감할 수 없습니다.",
  tie_needs_choice: "동률입니다. 동률 후보 중 하나를 골라 주세요.",
};

export async function closePoll(tripId: string, pollId: string, optionId?: string): Promise<Result> {
  const { supabase } = await authed();
  const { error } = await supabase.rpc("close_poll", { p_poll_id: pollId, p_option_id: optionId ?? null });
  if (error) return { error: CLOSE_ERRORS[error.message] ?? "마감하지 못했습니다." };
  // 일정에 항목이 들어갔으니 일정 탭도 갱신된다.
  revalidatePath(`/trips/${tripId}`);
  return {};
}

export async function deletePoll(tripId: string, pollId: string): Promise<Result> {
  const { supabase } = await authed();
  const { error, count } = await supabase.from("polls").delete({ count: "exact" }).eq("id", pollId).eq("trip_id", tripId);
  if (error || count === 0) return { error: "투표를 지우지 못했습니다." };
  revalidatePath(`/trips/${tripId}`);
  return {};
}
