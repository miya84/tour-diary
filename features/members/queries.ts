import "server-only";

import { createClient } from "@/lib/supabase/server";

export type Invitation = { tripId: string; title: string; startDate: string; endDate: string; inviterNickname: string };
export type Member = { userId: string; nickname: string; role: "owner" | "editor"; status: "member" | "pending" };

export async function listMyInvitations(): Promise<Invitation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_my_invitations");
  if (error) throw error;
  return (data ?? []).map((v: { trip_id: string; title: string; start_date: string; end_date: string; inviter_nickname: string }) => ({
    tripId: v.trip_id,
    title: v.title,
    startDate: v.start_date,
    endDate: v.end_date,
    inviterNickname: v.inviter_nickname,
  }));
}

export async function listTripMembers(tripId: string): Promise<Member[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_trip_members", { p_trip_id: tripId });
  if (error) throw error;
  const order = { owner: 0, editor: 1 };
  return (data ?? [])
    .map((m: { user_id: string; nickname: string; role: "owner" | "editor"; status: "member" | "pending" }) => ({
      userId: m.user_id,
      nickname: m.nickname,
      role: m.role,
      status: m.status,
    }))
    .sort((a: Member, b: Member) => order[a.role] - order[b.role] || (a.status === b.status ? 0 : a.status === "member" ? -1 : 1));
}
