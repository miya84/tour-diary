"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const [pending, setPending] = useState(false);

  // 페이지를 한 번만 새로 불러와 헤더까지 로그아웃 상태로 그린다(push + refresh처럼 두 번 그리지 않는다).
  const logout = async () => {
    setPending(true);
    await createClient().auth.signOut();
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- 로그인 상태가 바뀌면 레이아웃까지 새로 받는다
    window.location.assign("/auth/login");
  };

  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={logout}>
      {pending ? "나가는 중…" : "로그아웃"}
    </Button>
  );
}
