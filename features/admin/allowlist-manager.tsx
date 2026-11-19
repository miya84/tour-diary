"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { addAllowedEmail, removeAllowedEmail } from "./actions";
import { normalizeEmail, validateAllowlistEmail } from "./allowlist";
import type { AllowedEmail } from "./queries";

export function AllowlistManager({ emails }: { emails: AllowedEmail[] }) {
  const [email, setEmail] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    const message = validateAllowlistEmail(email, emails.map((x) => x.email));
    if (message) return setError(message);
    const target = normalizeEmail(email);
    startTransition(async () => {
      const res = await addAllowedEmail(target);
      setError(res.error ?? null);
      if (!res.error) {
        setEmail("");
        setNotice(`${target}로 가입할 수 있습니다.`);
      }
    });
  };

  const remove = (target: string) =>
    startTransition(async () => {
      const res = await removeAllowedEmail(target);
      setError(res.error ?? null);
      setNotice(null);
      setConfirming(null);
    });

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={add} noValidate className="grid gap-2 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
        <Label htmlFor="allow-email">가입을 허락할 이메일</Label>
        <div className="flex gap-2">
          <Input
            id="allow-email"
            type="email"
            placeholder="friend@example.com"
            value={email}
            aria-invalid={error ? true : undefined}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" disabled={pending}>
            {pending ? "추가하는 중…" : "추가"}
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {notice && !error && <p className="text-sm text-primary">{notice}</p>}
        <p className="text-sm text-muted-foreground">목록에 있는 이메일만 가입할 수 있습니다. 대소문자는 구분하지 않습니다. 이미 가입한 계정은 목록에서 지워도 그대로 씁니다.</p>
      </form>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">
          허용 목록 <span className="font-normal text-muted-foreground">{emails.length}</span>
        </h2>
        {emails.length ? (
          <ul className="flex flex-col divide-y rounded-2xl bg-card ring-1 ring-foreground/10">
            {emails.map((x) => (
              <li key={x.email} className="grid grid-cols-[1fr_auto] items-center gap-2 px-3 py-2">
                <span className="min-w-0 truncate text-sm" title={x.email}>
                  {x.email}
                </span>
                {confirming === x.email ? (
                  <span className="flex gap-1">
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => setConfirming(null)}>
                      취소
                    </Button>
                    <Button size="sm" variant="destructive" disabled={pending} onClick={() => remove(x.email)}>
                      정말 지우기
                    </Button>
                  </span>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setConfirming(x.email)}>
                    지우기
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            아직 허용한 이메일이 없습니다. 지금은 아무도 새로 가입할 수 없어요.
          </p>
        )}
      </section>
    </div>
  );
}
