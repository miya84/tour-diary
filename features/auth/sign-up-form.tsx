"use client";

import Link from "@/components/app-link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== repeatPassword) {
      setError("비밀번호가 서로 다릅니다.");
      return;
    }
    setIsLoading(true);
    const { data, error } = await createClient().auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }
    // 이메일 확인이 꺼져 있으면 가입 응답에 세션이 있다. 바로 로그인된 상태로 내 여행으로 간다.
    // 페이지를 한 번만 새로 불러와 헤더까지 로그인 상태로 그린다.
    if (data.session) {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- 로그인 상태가 바뀌면 레이아웃까지 새로 받는다
      window.location.assign("/");
      return;
    }
    setError("가입했지만 바로 로그인되지 않았습니다. 로그인 화면에서 다시 시도해 주세요.");
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>가입</CardTitle>
        <CardDescription>가입하면 바로 로그인됩니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignUp} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="repeat-password">비밀번호 확인</Label>
            <Input id="repeat-password" type="password" autoComplete="new-password" required value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "가입하는 중…" : "가입하기"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            이미 계정이 있나요?{" "}
            <Link href="/auth/login" className="text-primary underline-offset-4 hover:underline">
              로그인
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
