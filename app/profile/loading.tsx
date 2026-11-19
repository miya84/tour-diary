import { Skeleton } from "@/components/ui/skeleton";

// 프로필을 여는 동안 보여 주는 자리 표시: 제목, 닉네임 폼, 비밀번호 바꾸기 폼.
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="프로필을 불러오는 중" className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  );
}
