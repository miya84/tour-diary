export const BOOKING_KINDS = [
  { value: "flight", label: "항공" },
  { value: "lodging", label: "숙소" },
  { value: "transport", label: "교통" },
  { value: "ticket", label: "입장권" },
  { value: "meal", label: "식당" },
  { value: "other", label: "기타" },
] as const;

export type BookingKind = (typeof BOOKING_KINDS)[number]["value"];

export const kindLabel = (kind: string) => BOOKING_KINDS.find((k) => k.value === kind)?.label ?? "기타";

// 날짜가 있는 예약은 날짜순, 없는 예약은 그 뒤. 같은 날짜는 먼저 만든 순서.
export function sortBookings<T extends { bookingDate: string | null; createdAt: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    if (a.bookingDate && b.bookingDate && a.bookingDate !== b.bookingDate) return a.bookingDate < b.bookingDate ? -1 : 1;
    if (!a.bookingDate !== !b.bookingDate) return a.bookingDate ? -1 : 1;
    return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
  });
}
