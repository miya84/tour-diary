"use client";

import { APIProvider } from "@vis.gl/react-google-maps";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PlaceSearch } from "@/features/itinerary/place-search";
import type { Place } from "@/features/itinerary/types";
import { dayLabel } from "@/features/trips/dates";

import { addOption, castVote, closePoll, createPoll, deletePoll } from "./actions";
import { topOptionIds } from "./polls";
import type { Poll } from "./types";

export function PollsView({ tripId, days, polls }: { tripId: string; days: string[]; polls: Poll[] }) {
  const [creating, setCreating] = useState(false);

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""} language="ko">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">투표</h2>
        <Button size="sm" onClick={() => setCreating(true)}>
          ＋ 투표 만들기
        </Button>
      </div>

      {polls.length ? (
        <ul className="flex flex-col gap-3">
          {polls.map((p) => (
            <li key={p.id}>
              <PollCard tripId={tripId} poll={p} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-muted/70 px-4 py-8 text-center text-sm text-muted-foreground">
          <b className="text-[15px] font-semibold text-foreground">아직 투표가 없습니다</b>
          <span>후보지가 갈리면 투표로 정하세요. 마감하면 일정에 들어갑니다.</span>
          <Button size="sm" onClick={() => setCreating(true)}>
            첫 투표 만들기
          </Button>
        </div>
      )}

      <Sheet open={creating} onOpenChange={setCreating}>
        <SheetContent side="bottom" className="mx-auto max-h-[92svh] max-w-xl overflow-y-auto rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>투표 만들기</SheetTitle>
          </SheetHeader>
          {creating && <CreateForm tripId={tripId} days={days} onClose={() => setCreating(false)} />}
        </SheetContent>
      </Sheet>
    </APIProvider>
  );
}

function CreateForm({ tripId, days, onClose }: { tripId: string; days: string[]; onClose: () => void }) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [day, setDay] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return setError("질문을 입력해 주세요.");
    if (!day) return setError("반영할 날짜를 골라 주세요.");
    startTransition(async () => {
      const res = await createPoll(tripId, { question, day });
      if (res.error) return setError(res.error);
      router.refresh();
      onClose();
    });
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 px-4 pb-6">
      <div className="grid gap-2">
        <Label htmlFor="poll-question">질문</Label>
        <Input id="poll-question" maxLength={100} placeholder="예: 둘째 날 점심" value={question} onChange={(e) => setQuestion(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label>정해지면 넣을 날짜</Label>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="반영할 날짜">
          {days.map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={day === d}
              onClick={() => setDay(d)}
              className={"rounded-full border px-3 py-1 text-sm " + (day === d ? "border-primary bg-primary text-primary-foreground" : "border-border")}
            >
              {dayLabel(d).short} ({dayLabel(d).weekday})
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "만드는 중…" : "만들기"}
      </Button>
    </form>
  );
}

function PollCard({ tripId, poll }: { tripId: string; poll: Poll }) {
  const router = useRouter();
  const open = poll.status === "open";
  const [mode, setMode] = useState<"idle" | "adding" | "closing" | "deleting">("idle");
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState<Place | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const counts = Object.fromEntries(poll.options.map((o) => [o.id, o.votes]));
  const top = poll.options.length ? topOptionIds(counts) : [];
  const tie = top.length > 1;
  const totalVotes = poll.options.reduce((s, o) => s + o.votes, 0);

  const run = (fn: () => Promise<{ error?: string }>, after?: () => void) =>
    startTransition(async () => {
      const res = await fn();
      if (res.error) return setError(res.error);
      setError(null);
      after?.();
      router.refresh();
    });

  const vote = (optionId: string) => {
    if (!open || optionId === poll.myOptionId) return;
    run(() => castVote(tripId, poll.id, optionId));
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    run(() => addOption(tripId, poll.id, { title, place }), () => {
      setTitle("");
      setPlace(null);
      setMode("idle");
    });
  };

  const close = () => {
    if (tie && !pick) return setError("동률 후보 중 하나를 골라 주세요.");
    run(() => closePoll(tripId, poll.id, tie ? (pick ?? undefined) : undefined), () => setMode("idle"));
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-3 shadow-soft ring-1 ring-foreground/5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="break-words text-sm font-semibold">{poll.question}</div>
          <div className="text-xs text-muted-foreground">{dayLabel(poll.day).full}에 반영</div>
        </div>
        <span
          className={
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold " +
            (open ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground")
          }
        >
          {open ? "진행 중" : "마감"}
        </span>
      </div>

      {poll.options.length ? (
        <ul className="flex flex-col gap-1.5">
          {poll.options.map((o) => {
            const mine = o.id === poll.myOptionId;
            const won = o.id === poll.closedOptionId;
            return (
              <li key={o.id}>
                <button
                  type="button"
                  disabled={!open || pending}
                  onClick={() => vote(o.id)}
                  aria-pressed={mine}
                  className={
                    "relative grid w-full grid-cols-[1fr_auto] items-center gap-2 overflow-hidden rounded-xl border px-3 py-2 text-left text-sm " +
                    (won ? "border-primary bg-primary/10" : mine ? "border-primary" : "border-border")
                  }
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {won && "✓ "}
                      {o.title}
                    </span>
                    {o.place && <span className="block truncate text-xs text-muted-foreground">{o.place.name}</span>}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {mine && open && <b className="mr-1.5 text-primary">내 표</b>}
                    {o.votes}표
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{open ? "아직 후보가 없습니다. 후보를 올려 주세요." : "후보 없이 닫힌 투표입니다."}</p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {open && mode === "idle" && (
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setMode("deleting")}>
            삭제
          </Button>
          <Button size="sm" variant="outline" onClick={() => setMode("adding")}>
            ＋ 후보 올리기
          </Button>
          <Button size="sm" disabled={!poll.options.length} onClick={() => setMode("closing")}>
            마감
          </Button>
        </div>
      )}
      {!open && mode === "idle" && (
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" onClick={() => setMode("deleting")}>
            삭제
          </Button>
        </div>
      )}

      {mode === "adding" && (
        <form onSubmit={add} noValidate className="flex flex-col gap-3 border-t pt-3">
          <div className="grid gap-2">
            <Label htmlFor={`opt-${poll.id}`}>후보 이름</Label>
            <Input id={`opt-${poll.id}`} maxLength={100} placeholder="예: 이치란 라멘" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>
              장소 <span className="font-normal text-muted-foreground">선택</span>
            </Label>
            <PlaceSearch value={place} onChange={setPlace} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setMode("idle")}>
              취소
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              올리기
            </Button>
          </div>
        </form>
      )}

      {mode === "closing" && (
        <div className="flex flex-col gap-3 border-t pt-3 text-sm">
          {tie ? (
            <>
              <p>{totalVotes ? "동률입니다." : "아직 표가 없습니다."} 일정에 넣을 후보를 골라 주세요.</p>
              <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="동률 후보">
                {poll.options
                  .filter((o) => top.includes(o.id))
                  .map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      role="radio"
                      aria-checked={pick === o.id}
                      onClick={() => setPick(o.id)}
                      className={"rounded-xl border px-3 py-2 text-left " + (pick === o.id ? "border-primary bg-primary/10" : "border-border")}
                    >
                      {o.title}
                    </button>
                  ))}
              </div>
            </>
          ) : (
            <p>
              <b>{poll.options.find((o) => o.id === top[0])?.title}</b>이(가) 가장 많은 표를 받았습니다. 마감하면 {dayLabel(poll.day).short} 일정 맨 끝에 들어갑니다.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" disabled={pending} onClick={() => setMode("idle")}>
              취소
            </Button>
            <Button size="sm" disabled={pending} onClick={close}>
              마감하고 일정에 넣기
            </Button>
          </div>
        </div>
      )}

      {mode === "deleting" && (
        <div className="flex flex-col gap-3 border-t pt-3 text-sm">
          <p>투표를 삭제할까요? 이미 일정에 들어간 항목은 그대로 남습니다.</p>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" disabled={pending} onClick={() => setMode("idle")}>
              취소
            </Button>
            <Button size="sm" variant="destructive" disabled={pending} onClick={() => run(() => deletePoll(tripId, poll.id))}>
              정말 삭제
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
