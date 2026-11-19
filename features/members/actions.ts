"use server";

import { revalidatePath } from "next/cache";

import { createClient, getCurrentUser } from "@/lib/supabase/server";

import { inviteErrorMessage } from "./invite-errors";

type Result = { error?: string };

async function authed() {
  const user = await getCurrentUser();
  if (!user) throw new Error("로그인이 필요합니다.");
  return createClient();
}

export async function inviteMember(tripId: string, email: string): Promise<Result> {
  const supabase = await authed();
  if (!email.trim()) return { error: "이메일을 입력해 주세요." };
  const { error } = await supabase.rpc("invite_to_trip", { p_trip_id: tripId, p_email: email });
  if (error) return { error: inviteErrorMessage(error.message) };
  revalidatePath(`/trips/${tripId}`);
  return {};
}

// 수락 대기 초대 취소(만든 사람) 또는 받은 초대 거절(받은 사람). RLS가 누가 지울 수 있는지 정한다.
export async function deleteInvitation(tripId: string, inviteeId: string): Promise<Result> {
  const supabase = await authed();
  const { error, count } = await supabase
    .from("trip_invitations")
    .delete({ count: "exact" })
    .eq("trip_id", tripId)
    .eq("invitee_id", inviteeId);
  if (error || count === 0) return { error: "초대를 지우지 못했습니다." };
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/");
  return {};
}

export async function declineInvitation(tripId: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };
  return deleteInvitation(tripId, user.id);
}

export async function acceptInvitation(tripId: string): Promise<Result> {
  const supabase = await authed();
  const { error } = await supabase.rpc("accept_trip_invitation", { p_trip_id: tripId });
  if (error) return { error: "초대를 수락하지 못했습니다." };
  revalidatePath("/");
  return {};
}

export async function removeMember(tripId: string, userId: string): Promise<Result> {
  const supabase = await authed();
  const { error, count } = await supabase
    .from("trip_members")
    .delete({ count: "exact" })
    .eq("trip_id", tripId)
    .eq("user_id", userId);
  if (error || count === 0) return { error: "멤버를 내보내지 못했습니다." };
  revalidatePath(`/trips/${tripId}`);
  return {};
}
