export type PresenceLock = { key: string; at: number };
export type PresenceState = { clientId: string; name: string; locks: PresenceLock[] };

// 같은 잠금을 가진 접속 중 가장 이른 쪽이 주인이다(시각이 같으면 clientId가 작은 쪽).
// 주인이 내가 아니면 그 사람의 이름을, 나라면 null을 돌려준다.
export function lockedBy(states: PresenceState[], lockKey: string, myClientId: string): string | null {
  let owner: { clientId: string; name: string; at: number } | null = null;
  for (const s of states) {
    const lock = s.locks.find((l) => l.key === lockKey);
    if (!lock) continue;
    if (!owner || lock.at < owner.at || (lock.at === owner.at && s.clientId < owner.clientId)) {
      owner = { clientId: s.clientId, name: s.name, at: lock.at };
    }
  }
  return owner && owner.clientId !== myClientId ? owner.name : null;
}

export const itemLock = (id: string) => `item:${id}`;
export const orderLock = (day: string) => `order:${day}`;
export const bookingLock = (id: string) => `booking:${id}`;
export const expenseLock = (id: string) => `expense:${id}`;
