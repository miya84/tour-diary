import "server-only";

import { createClient, getCurrentUser } from "@/lib/supabase/server";

import { countVotes } from "./polls";
import type { Poll } from "./types";

// 멤버만 읽을 수 있다(RLS). 열린 투표를 먼저, 그 안에서는 새 투표가 위로 온다.
export async function listPolls(tripId: string): Promise<Poll[]> {
  const [user, supabase] = await Promise.all([getCurrentUser(), createClient()]);
  const { data, error } = await supabase
    .from("polls")
    .select(
      "id, question, day, status, closed_option_id, created_at, poll_options!poll_options_poll_id_fkey(id, title, place_id, place_name, lat, lng, created_at), poll_votes(user_id, option_id)",
    )
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const polls: Poll[] = data.map((p) => {
    const counts = countVotes(
      p.poll_options,
      p.poll_votes.map((v) => ({ optionId: v.option_id })),
    );
    return {
      id: p.id,
      question: p.question,
      day: p.day,
      status: p.status as Poll["status"],
      closedOptionId: p.closed_option_id,
      myOptionId: p.poll_votes.find((v) => v.user_id === user?.id)?.option_id ?? null,
      options: [...p.poll_options]
        .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
        .map((o) => ({
          id: o.id,
          title: o.title,
          votes: counts[o.id] ?? 0,
          place:
            o.place_id && o.lat !== null && o.lng !== null
              ? { placeId: o.place_id, name: o.place_name ?? "", lat: o.lat, lng: o.lng }
              : null,
        })),
    };
  });
  return [...polls.filter((p) => p.status === "open"), ...polls.filter((p) => p.status === "closed")];
}
