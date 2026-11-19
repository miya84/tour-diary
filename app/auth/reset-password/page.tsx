import { redirect } from "next/navigation";

import { NewPasswordForm } from "@/features/auth/new-password-form";
import { mustChangePassword } from "@/lib/password-reset-flag";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect("/auth/login");
  // 초기화되지 않은 계정은 이 화면을 쓸 일이 없다.
  if (!mustChangePassword(claims)) redirect("/");
  return <NewPasswordForm email={(claims.email as string | undefined) ?? ""} />;
}
