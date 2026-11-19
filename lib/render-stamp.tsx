"use client";

import { useEffect, useSyncExternalStore } from "react";

// 서버가 페이지를 새로 그릴 때마다 바뀌는 표시값.
// 저장 액션의 결과는 새 화면 데이터보다 먼저 도착하므로, 이 값이 바뀐 것을 보고 "새 데이터가 화면에 왔다"를 안다.
let current = "";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useRenderStamp() {
  return useSyncExternalStore(subscribe, () => current, () => "");
}

// 페이지(서버 컴포넌트)에서 렌더할 때마다 새 값을 넘긴다.
export function RenderStamp({ stamp }: { stamp: string }) {
  useEffect(() => {
    current = stamp;
    listeners.forEach((l) => l());
  }, [stamp]);
  return null;
}
