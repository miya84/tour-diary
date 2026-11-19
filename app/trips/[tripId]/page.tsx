import Link from "@/components/app-link";
import { CalendarDaysIcon, TicketIcon, VoteIcon, WalletIcon } from "lucide-react";
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
import { isTripMember, listTripMembers } from "@/features/members/queries";
import { getNicknames } from "@/features/profile/queries";
import { TripRealtime } from "@/features/realtime/trip-realtime";
import { CopyTripSheet } from "@/features/trips/copy-trip-sheet";
import { tripDays, tripPeriodLabel } from "@/features/trips/dates";
import { EditTripSheet } from "@/features/trips/edit-trip-sheet";
import { getTrip } from "@/features/trips/queries";
import { TripTabs } from "@/features/trips/trip-tabs";
import { getCurrentUser } from "@/lib/supabase/server";
import { RenderStamp } from "@/lib/render-stamp";

export default async function TripPage({ params }: PageProps<"/trips/[tripId]">) {
  const { tripId } = await params;
  const [user, trip] = await Promise.all([getCurrentUser(), getTrip(tripId)]);
  // 멤버가 아니면 RLS 때문에 여행이 보이지 않는다.
  if (!trip || !user) notFound();

  const days = tripDays(trip.startDate, trip.endDate);

  // 멤버가 아니면 열람자다: 일정과 지도만 읽을 수 있고, 다른 탭의 데이터는 RLS 때문에 어차피 보이지 않는다.
  if (!(await isTripMember(tripId, user.id))) {
    const [items, nicknames] = await Promise.all([listItems(tripId), getNicknames([trip.ownerId])]);
    return (
      <TripRealtime tripId={tripId} userName="" presence={false}>
        <RenderStamp stamp={crypto.randomUUID()} />
        <div>
          <Link href="/" className="text-sm text-muted-foreground">
            ← 내 여행
          </Link>
          <h1 className="mt-0.5 text-[22px] font-bold leading-tight tracking-tight">{trip.title}</h1>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
            <p className="whitespace-nowrap text-sm text-muted-foreground">{tripPeriodLabel(trip.startDate, trip.endDate)}</p>
            <CopyTripSheet trip={{ id: trip.id, title: trip.title, startDate: trip.startDate, endDate: trip.endDate }} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{nicknames[trip.ownerId] ?? "멤버"}님이 만든 여행 · 읽기 전용</p>
        </div>
        <TripView tripId={tripId} days={days} items={items} readOnly />
      </TripRealtime>
    );
  }

  const [items, members, bookings, expenses, rate, polls, paidTransferKeys] = await Promise.all([
    listItems(tripId),
    listTripMembers(tripId),
    listBookings(tripId),
    listExpenses(tripId),
    getExchangeRate(tripId),
    listPolls(tripId),
    listPaidTransferKeys(tripId),
  ]);
  // 경비의 낸 사람·나눌 사람은 수락한 멤버만 고를 수 있다.
  const people = members.filter((m) => m.status === "member").map((m) => ({ userId: m.userId, nickname: m.nickname }));

  const myName = members.find((m) => m.userId === user.id)?.nickname ?? "멤버";

  return (
    <TripRealtime tripId={tripId} userName={myName}>
      <RenderStamp stamp={crypto.randomUUID()} />
      <div>
        <Link href="/" className="text-sm text-muted-foreground">
          ← 내 여행
        </Link>
        <h1 className="mt-0.5 text-[22px] font-bold leading-tight tracking-tight">{trip.title}</h1>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
          <p className="whitespace-nowrap text-sm text-muted-foreground">{tripPeriodLabel(trip.startDate, trip.endDate)}</p>
          <div className="flex items-center gap-2">
            <CopyTripSheet trip={{ id: trip.id, title: trip.title, startDate: trip.startDate, endDate: trip.endDate }} />
            {trip.ownerId === user.id && <EditTripSheet tripId={tripId} trip={{ title: trip.title, startDate: trip.startDate, endDate: trip.endDate }} />}
            <MembersSheet tripId={tripId} members={members} currentUserId={user.id} isOwner={trip.ownerId === user.id} />
          </div>
        </div>
      </div>
      <TripTabs
        tabs={[
          { id: "itinerary", label: "일정", icon: <CalendarDaysIcon />, content: <TripView tripId={tripId} days={days} items={items} /> },
          { id: "bookings", label: "예약함", icon: <TicketIcon />, content: <BookingsView tripId={tripId} bookings={bookings} /> },
          {
            id: "expenses",
            label: "경비",
            icon: <WalletIcon />,
            content: (
              <ExpensesView tripId={tripId} days={days} people={people} currentUserId={user.id} expenses={expenses}
                krwPer100Jpy={rate}
                paidTransferKeys={paidTransferKeys}
              />
            ),
          },
          { id: "polls", label: "투표", icon: <VoteIcon />, content: <PollsView tripId={tripId} days={days} polls={polls} /> },
        ]}
      />
    </TripRealtime>
  );
}
