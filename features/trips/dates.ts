const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 날짜 문자열(YYYY-MM-DD)을 시간대 영향 없이 다루기 위해 UTC 자정으로 해석한다.
function toUtc(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function isValidRange(start: string, end: string) {
  return ISO_DATE.test(start) && ISO_DATE.test(end) && start <= end;
}

// 여행을 만들 때와 고칠 때 같은 검증을 쓴다.
export function tripInputError({ title, start, end }: { title: string; start: string; end: string }): string | null {
  if (!title.trim()) return "제목을 입력해 주세요.";
  if (!start || !end) return "시작일과 종료일을 모두 정해 주세요.";
  if (!isValidRange(start, end)) return "종료일은 시작일보다 빠를 수 없습니다.";
  return null;
}

export function tripDays(start: string, end: string) {
  const days: string[] = [];
  for (let d = toUtc(start); toIso(d) <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    days.push(toIso(d));
  }
  return days;
}

export function dayLabel(day: string) {
  const d = toUtc(day);
  const month = d.getUTCMonth() + 1;
  const date = d.getUTCDate();
  const weekday = WEEKDAYS[d.getUTCDay()];
  return { short: `${month}.${date}`, weekday, full: `${month}월 ${date}일 · ${weekday}요일` };
}

export function tripPeriodLabel(start: string, end: string) {
  const s = toUtc(start);
  const e = toUtc(end);
  const head = `${s.getUTCFullYear()}. ${s.getUTCMonth() + 1}. ${s.getUTCDate()}`;
  if (start === end) return `${head} · 당일`;
  const nights = tripDays(start, end).length - 1;
  return `${head} – ${e.getUTCMonth() + 1}. ${e.getUTCDate()} · ${nights}박 ${nights + 1}일`;
}
