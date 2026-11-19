import type { BookingKind } from "./bookings";

export type Attachment = { id: string; path: string; url: string };

export type Booking = {
  id: string;
  kind: BookingKind;
  title: string;
  bookingDate: string | null;
  reference: string | null;
  note: string | null;
  createdAt: string;
  attachments: Attachment[];
};

export type BookingInput = {
  kind: BookingKind | "";
  title: string;
  bookingDate: string;
  reference: string;
  note: string;
};
