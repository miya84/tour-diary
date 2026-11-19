import Link from "next/link";

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
        <TripRows trips={mine} currentUserId={currentUserId} tone="mine" />
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-muted/70 px-4 py-8 text-center text-sm text-muted-foreground">
          <b className="text-[15px] font-semibold text-foreground">아직 내 여행이 없습니다</b>
          <span>제목과 날짜만 정하면 바로 시작할 수 있어요.</span>
          {emptyAction}
        </div>
      )}

      {others.length > 0 && (
        <section className="flex flex-col gap-2">
          <div>
            <h2 className="text-base font-bold">다른 사람의 여행</h2>
            <p className="text-xs text-muted-foreground">읽기만 할 수 있어요. 복사하면 내 여행으로 가져옵니다.</p>
          </div>
          <TripRows trips={others} currentUserId={currentUserId} tone="others" />
        </section>
      )}
    </div>
  );
}

// 한 상자 안에 여행을 한 줄씩 둔다. 줄의 왼쪽이 링크이고, 복사하기 버튼은 링크 밖 오른쪽에 둔다(링크 안에 버튼을 중첩하지 않는다).
// 내 여행은 옅은 파란 바탕으로 띄우고, 다른 사람의 여행은 그림자 없는 회색 바탕으로 한 단계 물린다.
function TripRows({ trips, currentUserId, tone }: { trips: TripSummary[]; currentUserId: string; tone: "mine" | "others" }) {
  return (
    <ul
      className={
        "divide-y overflow-hidden rounded-2xl " +
        (tone === "mine" ? "divide-primary/10 bg-primary/[0.06] shadow-soft ring-1 ring-primary/15" : "divide-foreground/5 bg-muted/70")
      }
    >
      {trips.map((t) => {
        const owner = !t.isMember ? `${t.ownerNickname}님 · 읽기 전용` : t.ownerId !== currentUserId ? `${t.ownerNickname}님 · 함께 편집` : null;
        return (
          <li key={t.id} className={"flex items-center gap-2 pr-3 " + (tone === "mine" ? "hover:bg-primary/[0.08]" : "hover:bg-muted")}>
            <Link href={`/trips/${t.id}`} className="min-w-0 flex-1 py-3 pl-4">
              <h3 className={"truncate text-[15px] font-semibold " + (tone === "mine" ? "text-primary" : "")}>{t.title}</h3>
              <p className="mt-0.5 truncate text-xs text-muted-foreground tabular-nums">{tripPeriodLabel(t.startDate, t.endDate)}</p>
              <p className="truncate text-xs text-muted-foreground">
                일정 {t.itemCount}개{owner && ` · ${owner}`}
              </p>
            </Link>
            <CopyTripSheet trip={{ id: t.id, title: t.title, startDate: t.startDate, endDate: t.endDate }} />
          </li>
        );
      })}
    </ul>
  );
}
