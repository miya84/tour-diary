import { notFound, redirect } from "next/navigation";

import { AllowlistManager } from "@/features/admin/allowlist-manager";
import { PasswordResetForm } from "@/features/admin/password-reset-form";
import { isAppAdmin, listAllowedEmails } from "@/features/admin/queries";
import { getCurrentUser } from "@/lib/supabase/server";
import { RenderStamp } from "@/lib/render-stamp";
import { BackLink } from "@/components/back-link";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/admin");
  // 어드민이 아니면 이 화면이 있다는 것도 알리지 않는다.
  if (!(await isAppAdmin(user.id))) notFound();
  const emails = await listAllowedEmails();

  return (
    <>
      <RenderStamp stamp={crypto.randomUUID()} />
      <div>
        <BackLink href="/">내 여행</BackLink>
        <h1 className="text-[22px] font-bold leading-tight tracking-tight">어드민</h1>
      </div>
      <AllowlistManager emails={emails} />
      <PasswordResetForm />
    </>
  );
}
