import "server-only";

import { getNicknames } from "@/features/profile/queries";
import { createClient } from "@/lib/supabase/server";

export type TripSummary = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  ownerId: string;
  ownerNickname: string;
  itemCount: number;
  // 내가 멤버인 여행인가(아니면 읽기만 한다)
  isMember: boolean;
};

// 가입한 회원은 모든 여행을 읽을 수 있다. 수정은 멤버만 한다.
export async function listTrips(userId: string): Promise<TripSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .select("id, title, start_date, end_date, user_id, itinerary_items(count)")
    .order("start_date", { ascending: false });
  if (error) throw error;
  const [nicknames, { data: mine, error: memberError }] = await Promise.all([
    getNicknames([...new Set(data.map((t) => t.user_id))]),
    supabase.from("trip_members").select("trip_id").eq("user_id", userId),
  ]);
  if (memberError) throw memberError;
  const memberOf = new Set((mine ?? []).map((m) => m.trip_id));
  return data.map((t) => ({
    id: t.id,
    title: t.title,
    startDate: t.start_date,
    endDate: t.end_date,
    ownerId: t.user_id,
    ownerNickname: nicknames[t.user_id] ?? "멤버",
    itemCount: (t.itinerary_items as unknown as { count: number }[])[0]?.count ?? 0,
    isMember: memberOf.has(t.id),
  }));
}

export async function getTrip(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .select("id, title, start_date, end_date, user_id")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { id: data.id, title: data.title, startDate: data.start_date, endDate: data.end_date, ownerId: data.user_id };
}
