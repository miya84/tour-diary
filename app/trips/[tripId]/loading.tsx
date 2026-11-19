import { Skeleton } from "@/components/ui/skeleton";

// 여행 화면을 여는 동안 보여 주는 자리 표시: 제목, 탭, 날짜 탭, 지도, 일정 목록 순서.
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="여행을 불러오는 중" className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-9 rounded-full" />
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-16 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="aspect-[4/3] rounded-2xl" />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-16 rounded-2xl" />
      ))}
    </div>
  );
}
