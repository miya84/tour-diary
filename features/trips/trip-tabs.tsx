"use client";

import { useState } from "react";

// 여행 화면의 탭. 각 탭의 내용은 위에서 조립해 넘긴다(탭끼리는 서로 모른다).
export function TripTabs({ tabs }: { tabs: { id: string; label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0].id);

  return (
    <>
      <div role="tablist" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }} className="grid rounded-full bg-muted p-1 text-sm">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === active}
            onClick={() => setActive(t.id)}
            className={"rounded-full py-1.5 font-medium " + (t.id === active ? "bg-background shadow-sm" : "text-muted-foreground")}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (t.id === active ? <div key={t.id} className="flex flex-col gap-4">{t.content}</div> : null))}
    </>
  );
}
