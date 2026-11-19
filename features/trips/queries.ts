import "server-only";

import { createClient } from "@/lib/supabase/server";

export type TripSummary = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  ownerId: string;
  itemCount: number;
};

export async function listMyTrips(): Promise<TripSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .select("id, title, start_date, end_date, user_id, itinerary_items(count)")
    .order("start_date", { ascending: false });
  if (error) throw error;
  return data.map((t) => ({
    id: t.id,
    title: t.title,
    startDate: t.start_date,
    endDate: t.end_date,
    ownerId: t.user_id,
    itemCount: (t.itinerary_items as unknown as { count: number }[])[0]?.count ?? 0,
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
