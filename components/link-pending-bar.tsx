"use client";

import { useLinkStatus } from "next/link";

// 링크 이동이 진행 중일 때 화면 맨 위에 차오르는 막대. 0.1초 안에 끝나는 이동에서는 보이지 않는다.
export function LinkPendingBar() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={
        "pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-primary " +
        (pending ? "animate-[link-progress_8s_cubic-bezier(0.1,0.7,0.3,1)_0.1s_both]" : "hidden")
      }
    />
  );
}
