import Link from "@/components/app-link";

import { Card } from "@/components/ui/card";

import { CopyTripSheet } from "./copy-trip-sheet";
import { tripPeriodLabel } from "./dates";
import type { TripSummary } from "./queries";

export function TripList({
  trips,
  currentUserId,
  emptyAction,
}: {
  trips: TripSummary[];
  currentUserId: string;
  emptyAction: React.ReactNode;
}) {
  const mine = trips.filter((t) => t.isMember);
  const others = trips.filter((t) => !t.isMember);

  return (
    <div className="flex flex-col gap-6">
      {mine.length ? (
        <div className="flex flex-col gap-3">
          {mine.map((t) => (
            <TripCard key={t.id} trip={t} currentUserId={currentUserId} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          <b className="text-[15px] font-semibold text-foreground">아직 내 여행이 없습니다</b>
          <span>제목과 날짜만 정하면 바로 시작할 수 있어요.</span>
          {emptyAction}
        </div>
      )}

      {others.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">다른 사람의 여행</h2>
          <p className="-mt-2 text-sm text-muted-foreground">일정은 읽기만 할 수 있고, 복사해서 내 여행으로 가져올 수 있어요.</p>
          {others.map((t) => (
            <TripCard key={t.id} trip={t} currentUserId={currentUserId} />
          ))}
        </section>
      )}
    </div>
  );
}

// 카드 전체가 링크이고, 복사하기 버튼은 링크 밖에 둔다(링크 안에 버튼을 중첩하지 않는다).
function TripCard({ trip: t, currentUserId }: { trip: TripSummary; currentUserId: string }) {
  return (
    <Card className="gap-3 px-4 py-4">
      <Link href={`/trips/${t.id}`} className="flex flex-col gap-1">
        <h3 className="font-semibold">{t.title}</h3>
        <p className="text-sm text-muted-foreground">
          {tripPeriodLabel(t.startDate, t.endDate)} · 일정 {t.itemCount}개
        </p>
        {!t.isMember && <p className="text-sm text-muted-foreground">{t.ownerNickname}님이 만든 여행 · 읽기 전용</p>}
        {t.isMember && t.ownerId !== currentUserId && <p className="text-sm text-muted-foreground">{t.ownerNickname}님이 만든 여행 · 함께 편집</p>}
      </Link>
      <div className="flex justify-end">
        <CopyTripSheet trip={{ id: t.id, title: t.title, startDate: t.startDate, endDate: t.endDate }} />
      </div>
    </Card>
  );
}
