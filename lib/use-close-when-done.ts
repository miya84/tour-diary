"use client";

import { useEffect, useRef, useState } from "react";

import { useRenderStamp } from "./render-stamp";

// 새 데이터가 끝내 오지 않는 경우(다시 그릴 화면이 없는 액션 등)에도 시트가 열린 채 남지 않게 하는 상한.
const MAX_WAIT_MS = 5000;

// 저장 액션의 결과가 와도 새 화면 데이터는 그 뒤에 이어서 그려진다.
// 결과를 받자마자 닫으면 옛 화면이 잠깐 보이므로, 서버가 페이지를 새로 그려 화면에 도착한 뒤에 닫는다.
// 돌려주는 함수를 저장이 성공했을 때 부르고, 닫힐 때까지 waiting이 true다(버튼을 "저장하는 중…"으로 둔다).
export function useCloseWhenDone(pending: boolean, onClose: () => void) {
  const stamp = useRenderStamp();
  const stampAtDone = useRef<string | null>(null);
  const [done, setDone] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => setTimedOut(true), MAX_WAIT_MS);
    return () => clearTimeout(timer);
  }, [done]);

  useEffect(() => {
    if (done && !pending && (stamp !== stampAtDone.current || timedOut)) onClose();
  }, [done, pending, stamp, timedOut, onClose]);

  const finish = () => {
    stampAtDone.current = stamp;
    setDone(true);
  };
  return { finish, waiting: done || pending };
}
