import { ReceivedInvitations } from "@/features/members/received-invitations";
import { listMyInvitations } from "@/features/members/queries";
import { NewTripSheet } from "@/features/trips/new-trip-sheet";
import { TripList } from "@/features/trips/trip-list";
import { listMyTrips } from "@/features/trips/queries";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function Home() {
  const [user, trips, invitations] = await Promise.all([getCurrentUser(), listMyTrips(), listMyInvitations()]);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">내 여행</h1>
        <NewTripSheet label="새 여행" />
      </div>
      <ReceivedInvitations invitations={invitations} />
      <TripList trips={trips} currentUserId={user?.id ?? ""} emptyAction={<NewTripSheet label="첫 여행 만들기" />} />
    </>
  );
}
