"use client";

import { APIProvider } from "@vis.gl/react-google-maps";
import { GripVerticalIcon, PencilIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { dayLabel } from "@/features/trips/dates";

import { reorderItems } from "./actions";
import { DayRouteMap } from "./day-route-map";
import { ItemSheet } from "./item-sheet";
import { moveId, pinNumbers, routePoints } from "./route";
import type { ItineraryItem } from "./types";

export function TripView({ tripId, days, items }: { tripId: string; days: string[]; items: ItineraryItem[] }) {
  const router = useRouter();
  const [activeDay, setActiveDay] = useState(days[0]);
  const [reordering, setReordering] = useState(false);
  const [sheet, setSheet] = useState<{ open: boolean; item: ItineraryItem | null }>({ open: false, item: null });
  // 순서 변경 중에는 서버 응답을 기다리지 않고 화면 순서를 먼저 바꾼다.
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const serverDayItems = useMemo(() => items.filter((i) => i.day === activeDay), [items, activeDay]);
  const dayItems = useMemo(() => {
    if (!localOrder) return serverDayItems;
    const byId = new Map(serverDayItems.map((i) => [i.id, i]));
    return localOrder.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
  }, [serverDayItems, localOrder]);

  // 서버에서 새 목록이 오면 임시 순서를 버린다.
  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setLocalOrder(null);
  }

  const numbers = pinNumbers(dayItems);
  const points = useMemo(() => routePoints(dayItems), [dayItems]);

  const selectDay = (d: string) => {
    setActiveDay(d);
    setReordering(false);
    setLocalOrder(null);
  };

  const commitOrder = (ids: string[]) => {
    setLocalOrder(ids);
    startTransition(async () => {
      const res = await reorderItems(tripId, activeDay, ids);
      setError(res.error ?? null);
      router.refresh();
    });
  };

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""} language="ko">
      <div role="tablist" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
        {days.map((d, i) => {
          const l = dayLabel(d);
          const selected = d === activeDay;
          return (
            <button
              key={d}
              role="tab"
              aria-selected={selected}
              onClick={() => selectDay(d)}
              className={
                "flex min-w-16 flex-none flex-col items-center rounded-2xl border px-2.5 py-1.5 text-xs leading-snug " +
                (selected ? "border-primary bg-primary text-primary-foreground" : "border-border")
              }
            >
              <b className={"text-[11px] font-semibold " + (selected ? "text-primary-foreground/75" : "text-muted-foreground")}>DAY {i + 1}</b>
              {l.short} {l.weekday}
            </button>
          );
        })}
      </div>

      <DayRouteMap points={points} />

      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{dayLabel(activeDay).full}</h2>
        <div className="flex gap-2">
          {(dayItems.length > 1 || reordering) && (
            <Button size="sm" variant={reordering ? "default" : "outline"} onClick={() => setReordering((r) => !r)}>
              {reordering ? "완료" : "순서 변경"}
            </Button>
          )}
          {!reordering && (
            <Button size="sm" onClick={() => setSheet({ open: true, item: null })}>
              ＋ 일정 추가
            </Button>
          )}
        </div>
      </div>
      {reordering && <p className="-mt-2 text-sm text-muted-foreground">오른쪽 손잡이를 끌어서 순서를 바꾸세요. 지도 번호도 함께 바뀝니다.</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {dayItems.length ? (
        <ItemList items={dayItems} numbers={numbers} reordering={reordering} onEdit={(item) => setSheet({ open: true, item })} onReorder={commitOrder} />
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-4 py-7 text-center text-sm text-muted-foreground">
          <b className="text-[15px] font-semibold text-foreground">이 날은 아직 일정이 없습니다</b>
          <span>일정을 추가하면 장소가 있는 항목이 지도에 나타납니다.</span>
        </div>
      )}

      <ItemSheet
        tripId={tripId}
        days={days}
        item={sheet.item}
        defaultDay={activeDay}
        open={sheet.open}
        onOpenChange={(open) => setSheet((s) => ({ ...s, open }))}
        onSaved={(day) => {
          setActiveDay(day);
          router.refresh();
        }}
      />
    </APIProvider>
  );
}

function ItemList({
  items,
  numbers,
  reordering,
  onEdit,
  onReorder,
}: {
  items: ItineraryItem[];
  numbers: Map<string, number>;
  reordering: boolean;
  onEdit: (item: ItineraryItem) => void;
  onReorder: (ids: string[]) => void;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const [dragOrder, setDragOrder] = useState<string[] | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const order = dragOrder ?? items.map((i) => i.id);
  const byId = new Map(items.map((i) => [i.id, i]));
  const shown = order.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
  const liveNumbers = dragOrder ? pinNumbers(shown) : numbers;

  // 손잡이를 누른 채 움직이면, 포인터가 지나간 항목의 가운데를 기준으로 자리를 바꾼다(마우스·터치 공통).
  const startDrag = (e: React.PointerEvent, id: string) => {
    e.preventDefault();
    let current = items.map((i) => i.id);
    setDraggingId(id);
    setDragOrder(current);

    const move = (ev: PointerEvent) => {
      const rows = [...(listRef.current?.querySelectorAll<HTMLElement>("[data-item-id]") ?? [])].filter((r) => r.dataset.itemId !== id);
      const before = rows.find((r) => {
        const rect = r.getBoundingClientRect();
        return ev.clientY < rect.top + rect.height / 2;
      });
      const next = moveId(current, id, before?.dataset.itemId ?? null);
      if (next.join() !== current.join()) {
        current = next;
        setDragOrder(next);
      }
    };
    const up = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", up);
      setDraggingId(null);
      setDragOrder(null);
      if (current.join() !== items.map((i) => i.id).join()) onReorder(current);
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", up);
  };

  return (
    <ul ref={listRef} className={"flex flex-col gap-2 " + (reordering ? "select-none" : "")}>
      {shown.map((item) => {
        const n = liveNumbers.get(item.id);
        const sub = [item.startTime, item.note].filter(Boolean).join(" · ");
        return (
          <li
            key={item.id}
            data-item-id={item.id}
            className={
              "grid grid-cols-[28px_1fr_auto] items-start gap-2.5 rounded-2xl bg-card p-3 ring-1 " +
              (draggingId === item.id ? "relative z-10 bg-accent shadow-lg ring-2 ring-primary" : reordering ? "ring-primary/35" : "ring-foreground/10")
            }
          >
            {n ? (
              <span className="grid size-6.5 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{n}</span>
            ) : (
              <span className="grid size-6.5 place-items-center rounded-full bg-muted text-xs text-muted-foreground" title="장소 없음">
                –
              </span>
            )}
            <div className="min-w-0">
              <div className="text-sm font-semibold leading-snug">{item.title}</div>
              {item.place ? (
                <div className="mt-0.5 text-xs text-muted-foreground">📍 {item.place.name}</div>
              ) : (
                <span className="mt-1.5 inline-block rounded-full bg-muted px-2 py-px text-[11px] text-muted-foreground">장소 없음 · 지도에 안 나옴</span>
              )}
              {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
              {item.place && !reordering && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.place.name)}&query_place_id=${encodeURIComponent(item.place.placeId)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-block text-xs font-medium text-primary"
                >
                  지도 열기 ↗
                </a>
              )}
            </div>
            {reordering ? (
              <span
                role="button"
                aria-label="끌어서 순서 변경"
                onPointerDown={(e) => startDrag(e, item.id)}
                className="grid size-8 cursor-grab touch-none place-items-center rounded-full text-muted-foreground hover:bg-muted active:cursor-grabbing"
              >
                <GripVerticalIcon className="size-4" />
              </span>
            ) : (
              <Button size="icon-sm" variant="ghost" aria-label="수정" onClick={() => onEdit(item)}>
                <PencilIcon />
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
