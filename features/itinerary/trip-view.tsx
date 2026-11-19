"use client";

import { APIProvider } from "@vis.gl/react-google-maps";
import { GripVerticalIcon, PencilIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { itemLock, orderLock } from "@/features/realtime/locks";
import { useLock, useLockHolder, useLockedBy } from "@/features/realtime/trip-realtime";
import { dayLabel } from "@/features/trips/dates";

import { moveItemToDay, reorderItems } from "./actions";
import { DayRouteMap } from "./day-route-map";
import { ItemSheet } from "./item-sheet";
import { MoveDaySheet } from "./move-day-sheet";
import { moveId, pinNumbers, routePoints } from "./route";
import type { ItineraryItem } from "./types";

// readOnly면 열람자 화면이다: 일정을 보기만 하고 추가·수정·순서 변경·이동 버튼은 없다.
export function TripView({ tripId, days, items, readOnly = false }: { tripId: string; days: string[]; items: ItineraryItem[]; readOnly?: boolean }) {
  const router = useRouter();
  const [activeDay, setActiveDay] = useState(days[0]);
  const [reordering, setReordering] = useState(false);
  const [sheet, setSheet] = useState<{ open: boolean; item: ItineraryItem | null }>({ open: false, item: null });
  // 순서 변경 중에는 서버 응답을 기다리지 않고 화면 순서를 먼저 바꾼다.
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [moveOpen, setMoveOpen] = useState(false);
  // 항목을 끄는 동안 포인터가 올라 있는 날짜 탭
  const [dropDay, setDropDay] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // 수정 화면과 순서 변경은 열려 있는 동안 다른 멤버가 같은 것을 못 고치게 잠근다.
  useLock(sheet.item ? itemLock(sheet.item.id) : null, sheet.open);
  useLock(orderLock(activeDay), reordering);
  const orderHolder = useLockedBy(orderLock(activeDay));
  const holder = useLockHolder();
  // 다른 멤버가 순서를 변경 중인 날짜로는 옮길 수 없다.
  const dayLocker = (d: string) => holder(orderLock(d));

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

  const moveItem = (id: string, day: string) => {
    const locker = dayLocker(day) ?? holder(itemLock(id));
    if (locker) {
      setError(`${locker}님이 작업 중이라 지금은 옮길 수 없습니다.`);
      return;
    }
    startTransition(async () => {
      const res = await moveItemToDay(tripId, id, day);
      setError(res.error ?? null);
      setLocalOrder(null);
      router.refresh();
    });
  };

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""} language="ko">
      <div role="tablist" className="flex gap-1 overflow-x-auto rounded-2xl bg-muted p-1">
        {days.map((d, i) => {
          const l = dayLabel(d);
          const selected = d === activeDay;
          return (
            <button
              key={d}
              role="tab"
              aria-selected={selected}
              data-day-tab={d}
              onClick={() => selectDay(d)}
              className={
                "flex min-w-16 flex-1 flex-col items-center rounded-xl px-2 py-1.5 text-[11px] leading-tight " +
                (dropDay === d ? "bg-primary/15 ring-2 ring-primary " : "") +
                (selected ? "bg-background text-primary shadow-soft" : "text-muted-foreground")
              }
            >
              <b className={"text-sm font-bold " + (selected ? "text-primary" : "text-foreground")}>
                {l.short} <span className="text-xs font-medium">{l.weekday}</span>
              </b>
              DAY {i + 1}
            </button>
          );
        })}
      </div>

      <DayRouteMap points={points} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="whitespace-nowrap text-base font-bold">{dayLabel(activeDay).full}</h2>
        <div className="ml-auto flex gap-1.5">
          {!readOnly && (dayItems.length > 1 || reordering) && (
            <Button size="sm" variant={reordering ? "default" : "outline"} disabled={!!orderHolder && !reordering} onClick={() => setReordering((r) => !r)}>
              {reordering ? "완료" : "순서 변경"}
            </Button>
          )}
          {!readOnly && !reordering && dayItems.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => setMoveOpen(true)}>
              하루 옮기기
            </Button>
          )}
          {!readOnly && !reordering && (
            <Button size="sm" onClick={() => setSheet({ open: true, item: null })}>
              ＋ 일정 추가
            </Button>
          )}
        </div>
      </div>
      {orderHolder && !reordering && <p className="-mt-2 text-sm text-muted-foreground">{orderHolder}님이 순서 변경 중입니다.</p>}
      {reordering && (
        <p className="-mt-2 text-sm text-muted-foreground">
          오른쪽 손잡이를 끌어서 순서를 바꾸세요. 위쪽 날짜 탭에 놓으면 그날 맨 끝으로 옮겨집니다. 지도 번호도 함께 바뀝니다.
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {dayItems.length ? (
        <ItemList
          items={dayItems}
          numbers={numbers}
          reordering={reordering}
          readOnly={readOnly}
          currentDay={activeDay}
          onHoverDay={(d) => setDropDay(d && !dayLocker(d) ? d : null)}
          onEdit={(item) => setSheet({ open: true, item })}
          onReorder={commitOrder}
          onMoveToDay={moveItem}
        />
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-muted/70 px-4 py-7 text-center text-sm text-muted-foreground">
          <b className="text-[15px] font-semibold text-foreground">이 날은 아직 일정이 없습니다</b>
          {!readOnly && <span>일정을 추가하면 장소가 있는 항목이 지도에 나타납니다.</span>}
        </div>
      )}

      <MoveDaySheet
        tripId={tripId}
        days={days}
        items={items}
        fromDay={activeDay}
        lockedBy={dayLocker}
        open={moveOpen}
        onOpenChange={setMoveOpen}
        onMoved={(day) => {
          selectDay(day);
          router.refresh();
        }}
      />

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
  readOnly,
  currentDay,
  onHoverDay,
  onEdit,
  onReorder,
  onMoveToDay,
}: {
  items: ItineraryItem[];
  numbers: Map<string, number>;
  reordering: boolean;
  readOnly: boolean;
  currentDay: string;
  onHoverDay: (day: string | null) => void;
  onEdit: (item: ItineraryItem) => void;
  onReorder: (ids: string[]) => void;
  onMoveToDay: (id: string, day: string) => void;
}) {
  const holder = useLockHolder();
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

    // 포인터가 다른 날짜 탭 위에 있으면 그 날짜가 놓을 곳이다(순서 변경은 하지 않는다).
    let hoverDay: string | null = null;
    const move = (ev: PointerEvent) => {
      const tab = document.elementFromPoint(ev.clientX, ev.clientY)?.closest<HTMLElement>("[data-day-tab]");
      const day = tab?.dataset.dayTab && tab.dataset.dayTab !== currentDay ? tab.dataset.dayTab : null;
      if (day !== hoverDay) {
        hoverDay = day;
        onHoverDay(day);
      }
      if (day) return;
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
      onHoverDay(null);
      if (hoverDay) {
        onMoveToDay(id, hoverDay); // 잠긴 날짜면 부모가 안내 문구를 보여 준다
        return;
      }
      if (current.join() !== items.map((i) => i.id).join()) onReorder(current);
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", up);
  };

  return (
    // 타임라인: 왼쪽 시간, 세로선 위의 지도 번호(장소 없는 항목은 빈 점), 오른쪽 내용.
    <ul ref={listRef} className={"flex flex-col " + (reordering ? "select-none" : "")}>
      {shown.map((item, index) => {
        const n = liveNumbers.get(item.id);
        const editor = holder(itemLock(item.id));
        return (
          <li
            key={item.id}
            data-item-id={item.id}
            className={
              "relative grid grid-cols-[2.75rem_1.375rem_1fr_auto] items-start gap-x-2 rounded-xl py-2 " +
              (draggingId === item.id ? "z-10 bg-accent shadow-lg ring-2 ring-primary" : "")
            }
          >
            <span
              aria-hidden
              className={
                "absolute left-[3.875rem] w-0.5 bg-border " +
                (index === 0 ? "top-4 " : "top-0 ") +
                (index === shown.length - 1 ? "h-4" : "bottom-0")
              }
            />
            <span className={"pt-0.5 text-right text-[13px] tabular-nums " + (item.startTime ? "font-bold" : "text-muted-foreground")}>
              {item.startTime || "—"}
            </span>
            {n ? (
              <span className="relative grid size-5.5 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground ring-4 ring-background">
                {n}
              </span>
            ) : (
              <span className="relative mt-1.5 size-3 justify-self-center rounded-full border-2 border-muted-foreground/40 bg-background" title="장소 없음" />
            )}
            <div className="min-w-0">
              <div className="text-[15px] font-medium leading-snug">{item.title}</div>
              {item.place && (
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">📍 {item.place.name}</span>
                  {!reordering && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.place.name)}&query_place_id=${encodeURIComponent(item.place.placeId)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary"
                    >
                      지도 열기 ↗
                    </a>
                  )}
                </div>
              )}
              {item.note && <div className="mt-0.5 text-xs text-muted-foreground">{item.note}</div>}
              {editor && <div className="mt-0.5 text-xs font-medium text-primary">{editor}님이 수정 중</div>}
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
            ) : readOnly ? null : (
              <Button size="icon-sm" variant="ghost" aria-label="수정" disabled={!!editor} onClick={() => onEdit(item)}>
                <PencilIcon />
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
