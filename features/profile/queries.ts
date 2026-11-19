import "server-only";

import { createClient } from "@/lib/supabase/server";

export type Profile = { id: string; nickname: string };

export async function getMyProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("id, nickname").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

// 같은 여행 사람들의 닉네임. RLS가 읽을 수 있는 사람만 돌려준다.
export async function getNicknames(userIds: string[]): Promise<Record<string, string>> {
  if (!userIds.length) return {};
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("id, nickname").in("id", userIds);
  if (error) throw error;
  return Object.fromEntries(data.map((p) => [p.id, p.nickname]));
}
