import Link from "next/link";

import { Card } from "@/components/ui/card";

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
  if (!trips.length) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        <b className="text-[15px] font-semibold text-foreground">아직 여행이 없습니다</b>
        <span>제목과 날짜만 정하면 바로 시작할 수 있어요.</span>
        {emptyAction}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {trips.map((t) => (
        <Link key={t.id} href={`/trips/${t.id}`}>
          <Card className="gap-1 px-4 py-4 transition-colors hover:bg-muted/40">
            <h3 className="font-semibold">{t.title}</h3>
            <p className="text-sm text-muted-foreground">
              {tripPeriodLabel(t.startDate, t.endDate)} · 일정 {t.itemCount}개
            </p>
            {t.ownerId !== currentUserId && <p className="text-sm text-muted-foreground">초대받은 여행 · 함께 편집</p>}
          </Card>
        </Link>
      ))}
    </div>
  );
}
