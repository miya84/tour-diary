import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingsView } from "@/features/bookings/bookings-view";
import { listBookings } from "@/features/bookings/queries";
import { ExpensesView } from "@/features/expenses/expenses-view";
import { getExchangeRate, listExpenses, listPaidTransferKeys } from "@/features/expenses/queries";
import { listItems } from "@/features/itinerary/queries";
import { TripView } from "@/features/itinerary/trip-view";
import { listPolls } from "@/features/polls/queries";
import { PollsView } from "@/features/polls/polls-view";
import { MembersSheet } from "@/features/members/members-sheet";
import { listTripMembers } from "@/features/members/queries";
import { TripRealtime } from "@/features/realtime/trip-realtime";
import { tripDays, tripPeriodLabel } from "@/features/trips/dates";
import { EditTripSheet } from "@/features/trips/edit-trip-sheet";
import { getTrip } from "@/features/trips/queries";
import { TripTabs } from "@/features/trips/trip-tabs";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function TripPage({ params }: PageProps<"/trips/[tripId]">) {
  const { tripId } = await params;
  const [user, trip] = await Promise.all([getCurrentUser(), getTrip(tripId)]);
  // 멤버가 아니면 RLS 때문에 여행이 보이지 않는다.
  if (!trip || !user) notFound();

  const [items, members, bookings, expenses, rate, polls, paidTransferKeys] = await Promise.all([
    listItems(tripId),
    listTripMembers(tripId),
    listBookings(tripId),
    listExpenses(tripId),
    getExchangeRate(tripId),
    listPolls(tripId),
    listPaidTransferKeys(tripId),
  ]);
  const days = tripDays(trip.startDate, trip.endDate);
  // 경비의 낸 사람·나눌 사람은 수락한 멤버만 고를 수 있다.
  const people = members.filter((m) => m.status === "member").map((m) => ({ userId: m.userId, nickname: m.nickname }));

  const myName = members.find((m) => m.userId === user.id)?.nickname ?? "멤버";

  return (
    <TripRealtime tripId={tripId} userName={myName}>
      <div>
        <Link href="/" className="text-sm text-muted-foreground">
          ← 내 여행
        </Link>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">{trip.title}</h1>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{tripPeriodLabel(trip.startDate, trip.endDate)}</p>
          <div className="flex items-center gap-2">
            {trip.ownerId === user.id && <EditTripSheet tripId={tripId} trip={{ title: trip.title, startDate: trip.startDate, endDate: trip.endDate }} />}
            <MembersSheet tripId={tripId} members={members} currentUserId={user.id} isOwner={trip.ownerId === user.id} />
          </div>
        </div>
      </div>
      <TripTabs
        tabs={[
          { id: "itinerary", label: "일정", content: <TripView tripId={tripId} days={days} items={items} /> },
          { id: "bookings", label: "예약함", content: <BookingsView tripId={tripId} bookings={bookings} /> },
          {
            id: "expenses",
            label: "경비",
            content: (
              <ExpensesView tripId={tripId} days={days} people={people} currentUserId={user.id} expenses={expenses}
                krwPer100Jpy={rate}
                paidTransferKeys={paidTransferKeys}
              />
            ),
          },
          { id: "polls", label: "투표", content: <PollsView tripId={tripId} days={days} polls={polls} /> },
        ]}
      />
    </TripRealtime>
  );
}
