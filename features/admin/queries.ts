import "server-only";

import { createClient } from "@/lib/supabase/server";

// 어드민이면 자기 행 하나가 보인다(RLS).
export async function isAppAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("app_admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return !!data;
}

export type AllowedEmail = { email: string; createdAt: string };

// 어드민만 읽을 수 있다(RLS). 최근에 넣은 순서.
export async function listAllowedEmails(): Promise<AllowedEmail[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("signup_allowlist").select("email, created_at").order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((r) => ({ email: r.email, createdAt: r.created_at }));
}
