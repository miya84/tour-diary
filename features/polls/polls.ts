export type VoteCounts = Record<string, number>;

export function countVotes(options: { id: string }[], votes: { optionId: string }[]): VoteCounts {
  const counts: VoteCounts = Object.fromEntries(options.map((o) => [o.id, 0]));
  for (const v of votes) if (v.optionId in counts) counts[v.optionId] += 1;
  return counts;
}

// 최고 득표 후보의 id들. 하나면 정해진 것이고, 둘 이상이면 동률(표가 없을 때 포함)이다.
export function topOptionIds(counts: VoteCounts): string[] {
  const ids = Object.keys(counts);
  const max = Math.max(...Object.values(counts));
  return ids.filter((id) => counts[id] === max);
}

export function validatePollInput(input: { question: string; day: string }, days: string[]): string | null {
  if (!input.question.trim()) return "질문을 입력해 주세요.";
  if (input.question.length > 100) return "질문은 100자까지 쓸 수 있습니다.";
  if (!days.includes(input.day)) return "반영할 날짜를 골라 주세요.";
  return null;
}
