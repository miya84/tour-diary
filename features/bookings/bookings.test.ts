import { describe, expect, it } from "vitest";

import { sortBookings } from "./bookings";

const b = (id: string, date: string | null, createdAt = "2026-11-19T00:00:00Z") => ({ id, bookingDate: date, createdAt });

describe("sortBookings", () => {
  it("날짜가 있는 예약은 날짜순, 없는 예약은 그 뒤에 둔다 (AC4)", () => {
    const sorted = sortBookings([b("none", null), b("late", "2026-12-14"), b("early", "2026-12-12")]);
    expect(sorted.map((x) => x.id)).toEqual(["early", "late", "none"]);
  });

  it("같은 날짜는 먼저 만든 순서를 지킨다", () => {
    const sorted = sortBookings([b("b", "2026-12-12", "2026-11-19T02:00:00Z"), b("a", "2026-12-12", "2026-11-19T01:00:00Z")]);
    expect(sorted.map((x) => x.id)).toEqual(["a", "b"]);
  });
});
