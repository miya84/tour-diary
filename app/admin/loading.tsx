import { Skeleton } from "@/components/ui/skeleton";

// 어드민 화면을 여는 동안 보여 주는 자리 표시: 제목, 가입 허용 목록, 비밀번호 초기화.
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="어드민 화면을 불러오는 중" className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="h-48 rounded-2xl" />
      <Skeleton className="h-32 rounded-2xl" />
    </div>
  );
}
