"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import { deleteInvitation, inviteMember, removeMember } from "./actions";
import type { Member } from "./queries";

export function MembersSheet({
  tripId,
  members,
  currentUserId,
  isOwner,
}: {
  tripId: string;
  members: Member[];
  currentUserId: string;
  isOwner: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const memberCount = members.filter((m) => m.status === "member").length;

  const run = (action: () => Promise<{ error?: string }>, onOk?: () => void) =>
    startTransition(async () => {
      const { error } = await action();
      setError(error ?? null);
      if (!error) onOk?.();
    });

  const invite = (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    const target = email.trim();
    run(
      () => inviteMember(tripId, target),
      () => {
        setEmail("");
        setNotice(`${target}님에게 초대를 보냈습니다.`);
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        멤버 {memberCount}
      </Button>
      <SheetContent side="bottom" className="mx-auto max-w-xl rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>멤버</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-6">
          <ul className="flex flex-col gap-1">
            {members.map((m) => (
              <li key={m.userId} className="grid grid-cols-[32px_1fr_auto] items-center gap-3 py-1.5">
                <span className="grid size-8 place-items-center rounded-full bg-secondary text-[13px] font-semibold uppercase text-secondary-foreground">
                  {[...m.nickname][0]}
                </span>
                <div className="min-w-0 text-sm font-medium">
                  <span className="truncate">{m.nickname}</span>
                  {m.userId === currentUserId && <span className="text-muted-foreground"> (나)</span>}
                  {m.role === "owner" && <Tag>만든 사람</Tag>}
                  {m.status === "pending" && <Tag accent>수락 대기</Tag>}
                </div>
                {isOwner && m.role !== "owner" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() =>
                      run(() => (m.status === "pending" ? deleteInvitation(tripId, m.userId) : removeMember(tripId, m.userId)))
                    }
                  >
                    {m.status === "pending" ? "초대 취소" : "내보내기"}
                  </Button>
                )}
              </li>
            ))}
          </ul>

          {isOwner ? (
            <form onSubmit={invite} noValidate className="grid gap-2">
              <Label htmlFor="invite-email">이메일로 초대</Label>
              <div className="flex gap-2">
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="가입한 친구의 이메일"
                  value={email}
                  aria-invalid={error ? true : undefined}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button type="submit" disabled={pending}>
                  {pending ? "초대하는 중…" : "초대"}
                </Button>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {notice && !error && <p className="text-sm text-primary">{notice}</p>}
              <p className="text-sm text-muted-foreground">가입된 회원만 초대할 수 있습니다. 상대가 수락하면 함께 편집할 수 있어요.</p>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">초대와 내보내기는 여행을 만든 사람만 할 수 있습니다.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Tag({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={
        "ml-1.5 inline-block rounded-full px-2 py-px text-[11px] font-normal align-[1px] " +
        (accent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")
      }
    >
      {children}
    </span>
  );
}
