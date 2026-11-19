import type { Place } from "@/features/itinerary/types";

export type PollOption = { id: string; title: string; place: Place | null; votes: number };

export type Poll = {
  id: string;
  question: string;
  day: string;
  status: "open" | "closed";
  closedOptionId: string | null;
  options: PollOption[];
  myOptionId: string | null;
};
