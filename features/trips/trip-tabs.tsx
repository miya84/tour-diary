"use client";

import { useState } from "react";

// 여행 화면의 탭. 각 탭의 내용은 위에서 조립해 넘긴다(탭끼리는 서로 모른다).
// 탭 바는 엄지가 닿는 화면 아래에 떠 있고, 내용이 탭 바에 가리지 않게 아래 여백을 둔다.
export function TripTabs({ tabs }: { tabs: { id: string; label: string; icon: React.ReactNode; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0].id);

  return (
    <>
      {tabs.map((t) => (t.id === active ? <div key={t.id} className="flex flex-col gap-4 pb-24">{t.content}</div> : null))}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div
          role="tablist"
          className="pointer-events-auto mx-auto grid w-[calc(100%-2rem)] max-w-md auto-cols-fr grid-flow-col gap-1 rounded-full bg-background/95 p-1.5 shadow-soft ring-1 ring-foreground/5 backdrop-blur"
        >
          {tabs.map((t) => {
            const selected = t.id === active;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={selected}
                onClick={() => {
                  setActive(t.id);
                  window.scrollTo({ top: 0 });
                }}
                className={
                  "flex flex-col items-center gap-0.5 rounded-full py-1.5 text-xs font-semibold [&_svg]:size-5 " +
                  (selected ? "bg-primary/10 text-primary" : "text-muted-foreground")
                }
              >
                {t.icon}
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
