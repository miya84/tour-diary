"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { tripPeriodLabel } from "@/features/trips/dates";

import { acceptInvitation, declineInvitation } from "./actions";
import type { Invitation } from "./queries";

export function ReceivedInvitations({ invitations }: { invitations: Invitation[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!invitations.length) return null;

  const run = (action: () => Promise<{ error?: string }>) =>
    startTransition(async () => {
      const { error } = await action();
      setError(error ?? null);
    });

  return (
    <section className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-muted-foreground">받은 초대 {invitations.length}</p>
      {invitations.map((v) => (
        <div key={v.tripId} className="flex flex-col gap-3 rounded-2xl bg-primary/5 px-4 py-3.5 ring-1 ring-primary/30">
          <div className="text-sm leading-relaxed">
            <b className="font-semibold">{v.inviterNickname}</b>님이 <b className="font-semibold">{v.title}</b>에 초대했습니다.
            <div className="text-muted-foreground">{tripPeriodLabel(v.startDate, v.endDate)}</div>
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => declineInvitation(v.tripId))}>
              거절
            </Button>
            <Button size="sm" disabled={pending} onClick={() => run(() => acceptInvitation(v.tripId))}>
              수락
            </Button>
          </div>
        </div>
      ))}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </section>
  );
}
