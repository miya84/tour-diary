import { redirect } from "next/navigation";

import { ChangePasswordForm } from "@/features/auth/change-password-form";
import { getMyProfile } from "@/features/profile/queries";
import { ProfileForm } from "@/features/profile/profile-form";
import { getCurrentUser } from "@/lib/supabase/server";
import { RenderStamp } from "@/lib/render-stamp";
import { BackLink } from "@/components/back-link";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/profile");
  const profile = await getMyProfile(user.id);

  return (
    <>
      <RenderStamp stamp={crypto.randomUUID()} />
      <div>
        <BackLink href="/">내 여행</BackLink>
        <h1 className="text-[22px] font-bold leading-tight tracking-tight">프로필</h1>
      </div>
      <ProfileForm email={user.email} nickname={profile?.nickname ?? ""} />
      <ChangePasswordForm />
    </>
  );
}
