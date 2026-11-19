"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import { lockedBy, type PresenceLock, type PresenceState } from "./locks";

type Ctx = { holder: (key: string) => string | null; setLock: (key: string, on: boolean) => void };

const TripRealtimeContext = createContext<Ctx>({ holder: () => null, setLock: () => {} });

const REFRESH_DELAY_MS = 300;

// 여행 화면 전체를 감싼다. 1) DB 변경을 받으면 서버 데이터를 다시 불러오고,
// 2) 수정 중 잠금을 같은 여행의 다른 접속자와 공유한다.
// presence가 false면(열람자) 잠금 채널에는 들어가지 않고 변경만 받는다.
export function TripRealtime({
  tripId,
  userName,
  presence = true,
  children,
}: {
  tripId: string;
  userName: string;
  presence?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [clientId] = useState(() => crypto.randomUUID());
  const [states, setStates] = useState<PresenceState[]>([]);
  const myLocks = useRef(new Map<string, number>());
  const track = useRef<(() => void) | null>(null);

  // 1) 변경 수신
  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const channel = supabase
      .channel(`trip-changes:${tripId}:${clientId}`)
      .on("postgres_changes", { event: "*", schema: "public" }, () => {
        clearTimeout(timer);
        timer = setTimeout(() => router.refresh(), REFRESH_DELAY_MS);
      })
      .subscribe();
    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [tripId, clientId, router]);

  // 2) 잠금 공유(비공개 채널, 멤버만 들어간다)
  useEffect(() => {
    if (!presence) return;
    const supabase = createClient();
    let cancelled = false;
    let subscribed = false;
    const channel = supabase.channel(`trip:${tripId}`, { config: { private: true, presence: { key: clientId } } });

    const send = () => {
      if (!subscribed) return;
      const locks: PresenceLock[] = [...myLocks.current].map(([key, at]) => ({ key, at }));
      void channel.track({ name: userName, locks });
    };
    track.current = send;

    channel.on("presence", { event: "sync" }, () => {
      const all = channel.presenceState<{ name: string; locks: PresenceLock[] }>();
      setStates(
        Object.entries(all).flatMap(([key, metas]) => {
          const meta = metas[metas.length - 1];
          return meta ? [{ clientId: key, name: meta.name, locks: meta.locks ?? [] }] : [];
        }),
      );
    });

    void supabase.realtime.setAuth().then(() => {
      if (cancelled) return;
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          subscribed = true;
          send();
        }
      });
    });

    return () => {
      cancelled = true;
      subscribed = false;
      track.current = null;
      supabase.removeChannel(channel);
    };
  }, [tripId, clientId, userName, presence]);

  // setLock은 접속 상태가 바뀌어도 같은 함수여야 한다(바뀌면 잠금을 풀었다 다시 잡아 시각이 밀린다).
  const setLock = useCallback((key: string, on: boolean) => {
    if (on) {
      if (!myLocks.current.has(key)) myLocks.current.set(key, Date.now());
    } else {
      myLocks.current.delete(key);
    }
    track.current?.();
  }, []);

  const value = useMemo<Ctx>(() => ({ holder: (key) => lockedBy(states, key, clientId), setLock }), [states, clientId, setLock]);

  return <TripRealtimeContext.Provider value={value}>{children}</TripRealtimeContext.Provider>;
}

// 다른 사람이 이 잠금을 가지고 있으면 그 사람 이름, 아니면 null.
export function useLockedBy(key: string | null): string | null {
  const { holder } = useContext(TripRealtimeContext);
  return key ? holder(key) : null;
}

// on이 true인 동안 이 잠금을 가진다. 화면을 떠나거나 on이 꺼지면 푼다.
export function useLock(key: string | null, on: boolean) {
  const { setLock } = useContext(TripRealtimeContext);
  useEffect(() => {
    if (!key || !on) return;
    setLock(key, true);
    return () => setLock(key, false);
  }, [key, on, setLock]);
}

// 목록처럼 여러 키를 한꺼번에 물어볼 때 쓴다.
export function useLockHolder() {
  return useContext(TripRealtimeContext).holder;
}
