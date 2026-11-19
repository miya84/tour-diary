"use server";

import { revalidatePath } from "next/cache";

import { createClient, getCurrentUser } from "@/lib/supabase/server";

import { validateNickname } from "./nickname";

export type UpdateNicknameState = { error?: string; ok?: boolean; nickname?: string };

export async function updateNickname(_prev: UpdateNicknameState, formData: FormData): Promise<UpdateNicknameState> {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const result = validateNickname(String(formData.get("nickname") ?? ""));
  if (!result.ok) return { error: result.error };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("profiles")
    .update({ nickname: result.nickname }, { count: "exact" })
    .eq("id", user.id);
  if (error || count === 0) return { error: "닉네임을 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요." };

  revalidatePath("/", "layout");
  return { ok: true, nickname: result.nickname };
}
