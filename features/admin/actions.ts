"use server";

import { revalidatePath } from "next/cache";

import { createClient, getCurrentUser } from "@/lib/supabase/server";

import { normalizeEmail, validateAllowlistEmail } from "./allowlist";

type Result = { error?: string };

async function authed() {
  const user = await getCurrentUser();
  if (!user) throw new Error("로그인이 필요합니다.");
  return createClient();
}

// 어드민이 아니면 RLS가 막는다.
export async function addAllowedEmail(input: string): Promise<Result> {
  const message = validateAllowlistEmail(input, []);
  if (message) return { error: message };
  const supabase = await authed();
  const { error } = await supabase.from("signup_allowlist").insert({ email: normalizeEmail(input) });
  if (error?.code === "23505") return { error: "이미 목록에 있는 이메일입니다." };
  if (error) return { error: "이메일을 추가하지 못했습니다." };
  revalidatePath("/admin");
  return {};
}

export async function removeAllowedEmail(email: string): Promise<Result> {
  const supabase = await authed();
  const { error, count } = await supabase.from("signup_allowlist").delete({ count: "exact" }).eq("email", normalizeEmail(email));
  if (error || count === 0) return { error: "이메일을 지우지 못했습니다." };
  revalidatePath("/admin");
  return {};
}
