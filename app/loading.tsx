import { Skeleton } from "@/components/ui/skeleton";

// 서버가 다음 화면의 데이터를 가져오는 동안 바로 보여 주는 자리 표시. 홈(내 여행) 모양에 맞췄다.
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="불러오는 중" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
    </div>
  );
}
