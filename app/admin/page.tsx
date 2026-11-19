import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AllowlistManager } from "@/features/admin/allowlist-manager";
import { PasswordResetForm } from "@/features/admin/password-reset-form";
import { isAppAdmin, listAllowedEmails } from "@/features/admin/queries";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/admin");
  // 어드민이 아니면 이 화면이 있다는 것도 알리지 않는다.
  if (!(await isAppAdmin(user.id))) notFound();
  const emails = await listAllowedEmails();

  return (
    <>
      <div>
        <Link href="/" className="text-sm text-muted-foreground">
          ← 내 여행
        </Link>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">어드민</h1>
      </div>
      <AllowlistManager emails={emails} />
      <PasswordResetForm />
    </>
  );
}
