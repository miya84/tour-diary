"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { validatePasswordChange } from "./new-password";
import { changePassword } from "./new-password-actions";

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setDone(false);
    const message = validatePasswordChange(current, password, repeat);
    if (message) return setError(message);
    startTransition(async () => {
      const res = await changePassword(current, password, repeat);
      if (res.error) return setError(res.error);
      setError(null);
      setCurrent("");
      setPassword("");
      setRepeat("");
      setDone(true);
    });
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 border-t pt-5">
      <h2 className="text-base font-semibold">비밀번호 바꾸기</h2>
      <div className="grid gap-2">
        <Label htmlFor="current-password">현재 비밀번호</Label>
        <Input id="current-password" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="change-new-password">새 비밀번호</Label>
        <Input id="change-new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="change-repeat-password">새 비밀번호 확인</Label>
        <Input id="change-repeat-password" type="password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} />
        <p className="text-sm text-muted-foreground">6자 이상. 임시 비밀번호를 받았다면 기억하기 쉬운 비밀번호로 바꿔 두세요.</p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {done && !error && <p className="text-sm text-primary">비밀번호를 바꿨습니다. 다음 로그인부터 새 비밀번호를 쓰세요.</p>}
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "바꾸는 중…" : "비밀번호 바꾸기"}
      </Button>
    </form>
  );
}
