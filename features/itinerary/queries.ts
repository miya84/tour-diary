import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { ItineraryItem } from "./types";

export async function listItems(tripId: string): Promise<ItineraryItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("itinerary_items")
    .select("id, day, title, start_time, note, place_id, place_name, lat, lng, position")
    .eq("trip_id", tripId)
    .order("day")
    .order("position");
  if (error) throw error;
  return data.map((i) => ({
    id: i.id,
    day: i.day,
    title: i.title,
    startTime: i.start_time ? String(i.start_time).slice(0, 5) : "",
    note: i.note ?? "",
    place:
      i.place_id && i.lat !== null && i.lng !== null
        ? { placeId: i.place_id, name: i.place_name ?? "", lat: i.lat, lng: i.lng }
        : null,
  }));
}
