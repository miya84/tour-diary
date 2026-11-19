"use server";

import { redirect } from "next/navigation";

import { MUST_CHANGE_PASSWORD_KEY, mustChangePassword } from "@/lib/password-reset-flag";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { validateNewPassword, validatePasswordChange } from "./new-password";

// 로그인한 사람의 비밀번호 바꾸기. 현재 비밀번호로 다시 로그인해 본인인지 확인한 뒤 바꾼다.
export async function changePassword(current: string, password: string, repeat: string): Promise<{ error?: string; ok?: boolean }> {
  const message = validatePasswordChange(current, password, repeat);
  if (message) return { error: message };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email as string | undefined;
  if (!email) return { error: "다시 로그인해 주세요." };

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: current });
  if (signInError) return { error: "현재 비밀번호가 올바르지 않습니다." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error?.code === "same_password") return { error: "현재 비밀번호와 다른 비밀번호를 정해 주세요." };
  if (error?.code === "weak_password") return { error: "더 안전한 비밀번호를 정해 주세요." };
  if (error) return { error: "비밀번호를 바꾸지 못했습니다." };
  return { ok: true };
}

// 초기화된 계정만. 본인 세션으로 비밀번호를 바꾸고(임시 비밀번호와 같으면 Supabase가 거절한다),
// 표시를 지운 뒤 세션을 새로 받아 토큰에서도 표시가 빠지게 한다.
export async function setNewPassword(password: string, repeat: string): Promise<{ error?: string }> {
  const message = validateNewPassword(password, repeat);
  if (message) return { error: message };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return { error: "다시 로그인해 주세요." };
  if (!mustChangePassword(data.claims)) redirect("/");

  const { error } = await supabase.auth.updateUser({ password });
  if (error?.code === "same_password") return { error: "임시 비밀번호와 다른 비밀번호를 정해 주세요." };
  if (error?.code === "weak_password") return { error: "더 안전한 비밀번호를 정해 주세요." };
  if (error) return { error: "비밀번호를 저장하지 못했습니다." };

  const { error: flagError } = await createAdminClient().auth.admin.updateUserById(data.claims.sub, {
    app_metadata: { [MUST_CHANGE_PASSWORD_KEY]: null },
  });
  if (flagError) return { error: "비밀번호는 바꿨지만 마무리하지 못했습니다. 다시 시도해 주세요." };

  await supabase.auth.refreshSession();
  redirect("/");
}
