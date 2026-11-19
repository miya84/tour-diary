"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { validateNewPassword } from "./new-password";
import { setNewPassword } from "./new-password-actions";

export function NewPasswordForm({ email }: { email: string }) {
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = validateNewPassword(password, repeat);
    if (message) return setError(message);
    startTransition(async () => {
      // 성공하면 서버가 내 여행으로 보낸다.
      const res = await setNewPassword(password, repeat);
      if (res?.error) setError(res.error);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>새 비밀번호 정하기</CardTitle>
        <CardDescription>
          <span className="break-all">{email}</span>의 비밀번호가 초기화됐어요. 앞으로 쓸 비밀번호를 정해 주세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="new-password">새 비밀번호</Label>
            <Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="repeat-new-password">새 비밀번호 확인</Label>
            <Input id="repeat-new-password" type="password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "저장하는 중…" : "저장하고 시작하기"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
