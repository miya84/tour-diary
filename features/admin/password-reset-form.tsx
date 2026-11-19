"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { resetUserPassword } from "./password-actions";

export function PasswordResetForm() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<{ email: string; tempPassword: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    const target = email.trim().toLowerCase();
    if (!target) return setError("이메일을 입력해 주세요.");
    startTransition(async () => {
      const res = await resetUserPassword(target);
      if (res.error || !res.tempPassword) return setError(res.error ?? "비밀번호를 초기화하지 못했습니다.");
      setError(null);
      setEmail("");
      setResult({ email: target, tempPassword: res.tempPassword });
    });
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-2 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
      <Label htmlFor="reset-email">비밀번호 초기화</Label>
      <div className="flex gap-2">
        <Input
          id="reset-email"
          type="email"
          placeholder="비밀번호를 잊은 친구의 이메일"
          value={email}
          aria-invalid={error ? true : undefined}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "초기화하는 중…" : "초기화"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {result && (
        <div className="grid gap-1 rounded-xl bg-primary/5 p-3 text-sm ring-1 ring-primary/30">
          <span className="min-w-0 break-all">
            <b className="font-semibold">{result.email}</b>의 임시 비밀번호
          </span>
          <code className="select-all font-mono text-lg font-semibold tracking-wider">{result.tempPassword}</code>
          <span className="text-muted-foreground">이 화면을 벗어나면 다시 볼 수 없어요. 친구에게 전해 주세요. 로그인하면 새 비밀번호를 정하게 됩니다.</span>
        </div>
      )}
      <p className="text-sm text-muted-foreground">초기화하면 이전 비밀번호로는 로그인할 수 없습니다.</p>
    </form>
  );
}
