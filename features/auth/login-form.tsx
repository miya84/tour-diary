"use client";

import Link from "@/components/app-link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeNextPath } from "@/lib/safe-next-path";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      setIsLoading(false);
      return;
    }
    // 페이지를 한 번만 새로 불러온다. 헤더(루트 레이아웃)까지 로그인 상태로 다시 그려지고,
    // push + refresh처럼 서버가 화면을 두 번 그리지 않는다. 이동이 끝날 때까지 버튼은 "로그인하는 중…"으로 둔다.
    const next = new URLSearchParams(window.location.search).get("next");
    window.location.assign(safeNextPath(next, "/"));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>로그인</CardTitle>
        <CardDescription>이메일과 비밀번호로 들어옵니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "로그인하는 중…" : "로그인"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">비밀번호를 잊었나요? 앱 관리자에게 초기화를 부탁하세요.</p>
          <p className="text-center text-sm text-muted-foreground">
            계정이 없나요?{" "}
            <Link href="/auth/sign-up" className="text-primary underline-offset-4 hover:underline">
              가입하기
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
