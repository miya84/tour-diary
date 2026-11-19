type Placed = { id: string; place: { lat: number; lng: number } | null };

// 장소가 있는 일정 항목에만 목록 순서대로 1부터 번호를 매긴다.
export function pinNumbers(items: Placed[]) {
  const numbers = new Map<string, number>();
  for (const item of items) {
    if (item.place) numbers.set(item.id, numbers.size + 1);
  }
  return numbers;
}

export function routePoints(items: Placed[]) {
  const numbers = pinNumbers(items);
  return items.flatMap((item) =>
    item.place ? [{ id: item.id, lat: item.place.lat, lng: item.place.lng, number: numbers.get(item.id)! }] : [],
  );
}

// moving을 before 앞으로 옮긴다. before가 null이면 맨 끝으로 옮긴다.
export function moveId(ids: string[], moving: string, before: string | null) {
  const rest = ids.filter((id) => id !== moving);
  const at = before === null ? rest.length : rest.indexOf(before);
  rest.splice(at < 0 ? rest.length : at, 0, moving);
  return rest;
}
