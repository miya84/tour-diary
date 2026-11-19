import Link from "next/link";
import { redirect } from "next/navigation";

import { ChangePasswordForm } from "@/features/auth/change-password-form";
import { getMyProfile } from "@/features/profile/queries";
import { ProfileForm } from "@/features/profile/profile-form";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/profile");
  const profile = await getMyProfile(user.id);

  return (
    <>
      <div>
        <Link href="/" className="text-sm text-muted-foreground">
          ← 내 여행
        </Link>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">프로필</h1>
      </div>
      <ProfileForm email={user.email} nickname={profile?.nickname ?? ""} />
      <ChangePasswordForm />
    </>
  );
}
