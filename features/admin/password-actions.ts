"use server";

import { MUST_CHANGE_PASSWORD_KEY } from "@/lib/password-reset-flag";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/supabase/server";

import { normalizeEmail } from "./allowlist";
import { isAppAdmin } from "./queries";
import { generateTempPassword } from "./temp-password";

type Result = { error?: string; tempPassword?: string };

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// 어드민만. 임시 비밀번호로 바꾸고 "새 비밀번호를 정해야 함" 표시를 붙인다. 임시 비밀번호는 돌려주기만 하고 저장하지 않는다.
export async function resetUserPassword(input: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user || !(await isAppAdmin(user.id))) return { error: "어드민만 초기화할 수 있습니다." };

  const email = normalizeEmail(input);
  if (!EMAIL.test(email)) return { error: "이메일 형식이 아닙니다." };

  const admin = createAdminClient();
  // 친구 몇 명 규모라 한 페이지로 충분하다.
  const { data, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) return { error: "계정을 찾지 못했습니다." };
  const target = data.users.find((u) => u.email?.toLowerCase() === email);
  if (!target) return { error: "가입한 계정이 없는 이메일입니다." };

  const tempPassword = generateTempPassword();
  const { error } = await admin.auth.admin.updateUserById(target.id, {
    password: tempPassword,
    app_metadata: { [MUST_CHANGE_PASSWORD_KEY]: true },
  });
  if (error) return { error: "비밀번호를 초기화하지 못했습니다." };
  return { tempPassword };
}
