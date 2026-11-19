"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import { setTransferPaid } from "./actions";
import { formatMoney } from "./expenses";
import { type Settlement, type Transfer, transferKey } from "./settlement";

export function SettlementSheet({
  tripId,
  settlement,
  paidKeys,
  nickname,
}: {
  tripId: string;
  settlement: Settlement;
  paidKeys: string[];
  nickname: (userId: string) => string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const paid = new Set(paidKeys);

  const toggle = (t: Transfer) =>
    startTransition(async () => {
      const res = await setTransferPaid(tripId, t, !paid.has(transferKey(t)));
      setError(res.error ?? null);
      router.refresh();
    });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        정산 보기
      </Button>
      <SheetContent side="bottom" className="mx-auto max-h-[92svh] max-w-xl overflow-y-auto rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>정산</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-5 px-4 pb-6">
          {settlement.status === "empty" && <Notice>정산할 경비가 없습니다.</Notice>}
          {settlement.status === "needs_rate" && <Notice>엔 경비가 있어요. 경비 탭에서 여행 환율을 넣으면 원으로 정산합니다.</Notice>}
          {settlement.status === "ok" && (
            <>
              <section className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between text-sm">
                  <h3 className="font-semibold">사람별</h3>
                  <span className="text-muted-foreground tabular-nums">총 {formatMoney(settlement.total, "KRW")}</span>
                </div>
                <ul className="flex flex-col divide-y rounded-2xl bg-card text-sm shadow-soft ring-1 ring-foreground/5">
                  {settlement.people.map((p) => (
                    <li key={p.userId} className="grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2.5">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{nickname(p.userId)}</span>
                        <span className="block text-xs text-muted-foreground tabular-nums">
                          낸 돈 {formatMoney(p.paid, "KRW")} · 부담 {formatMoney(p.owed, "KRW")}
                        </span>
                      </span>
                      <span
                        className={"text-right font-semibold tabular-nums " + (p.net > 0 ? "text-primary" : p.net < 0 ? "text-destructive" : "text-muted-foreground")}
                      >
                        {p.net > 0 ? `받을 돈 ${formatMoney(p.net, "KRW")}` : p.net < 0 ? `보낼 돈 ${formatMoney(-p.net, "KRW")}` : "0"}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">보낼 돈</h3>
                {settlement.transfers.length ? (
                  <ul className="flex flex-col gap-2">
                    {settlement.transfers.map((t) => {
                      const done = paid.has(transferKey(t));
                      return (
                        <li
                          key={transferKey(t)}
                          className={"grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl p-3 shadow-soft ring-1 ring-foreground/5 " + (done ? "bg-muted" : "bg-card")}
                        >
                          <span className="min-w-0 text-sm">
                            <span className={"block truncate " + (done ? "text-muted-foreground line-through" : "")}>
                              {nickname(t.from)} → {nickname(t.to)}
                            </span>
                            <span className={"block font-semibold tabular-nums " + (done ? "text-muted-foreground" : "")}>{formatMoney(t.amount, "KRW")}</span>
                          </span>
                          <Button size="sm" variant={done ? "secondary" : "default"} disabled={pending} aria-pressed={done} onClick={() => toggle(t)}>
                            {done ? "보냄 ✓" : "보냈어요"}
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <Notice>보낼 돈이 없습니다.</Notice>
                )}
                {error && <p className="text-sm text-destructive">{error}</p>}
                <p className="text-xs text-muted-foreground">
                  모두 원으로 계산합니다. 엔 경비는 한 건씩 여행 환율로 바꿔 나눕니다. 경비가 바뀌어 금액이 달라지면 보냄 표시가 풀립니다.
                </p>
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl bg-muted/70 px-4 py-6 text-center text-sm text-muted-foreground">{children}</p>;
}
