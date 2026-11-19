import Link from "next/link";
import { notFound } from "next/navigation";

import { listItems } from "@/features/itinerary/queries";
import { TripView } from "@/features/itinerary/trip-view";
import { MembersSheet } from "@/features/members/members-sheet";
import { listTripMembers } from "@/features/members/queries";
import { tripDays, tripPeriodLabel } from "@/features/trips/dates";
import { getTrip } from "@/features/trips/queries";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function TripPage({ params }: PageProps<"/trips/[tripId]">) {
  const { tripId } = await params;
  const [user, trip] = await Promise.all([getCurrentUser(), getTrip(tripId)]);
  // 멤버가 아니면 RLS 때문에 여행이 보이지 않는다.
  if (!trip || !user) notFound();

  const [items, members] = await Promise.all([listItems(tripId), listTripMembers(tripId)]);

  return (
    <>
      <div>
        <Link href="/" className="text-sm text-muted-foreground">
          ← 내 여행
        </Link>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">{trip.title}</h1>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{tripPeriodLabel(trip.startDate, trip.endDate)}</p>
          <MembersSheet tripId={tripId} members={members} currentUserId={user.id} isOwner={trip.ownerId === user.id} />
        </div>
      </div>
      <TripView tripId={tripId} days={tripDays(trip.startDate, trip.endDate)} items={items} />
    </>
  );
}
