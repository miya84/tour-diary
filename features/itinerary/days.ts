// 하루 옮기기 안내에 쓴다. from의 일정이 to로 가고, to의 일정은 from으로 온다.
export function moveDayCounts(items: { day: string }[], from: string, to: string) {
  return {
    moving: items.filter((i) => i.day === from).length,
    swapping: items.filter((i) => i.day === to).length,
  };
}
