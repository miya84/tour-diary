export type Place = { placeId: string; name: string; lat: number; lng: number };

export type ItineraryItem = {
  id: string;
  day: string;
  title: string;
  startTime: string;
  note: string;
  place: Place | null;
};

export type ItemInput = Omit<ItineraryItem, "id">;
