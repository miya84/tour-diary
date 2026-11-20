import { ChevronLeftIcon } from "lucide-react";

import Link from "./app-link";

// 화면 맨 위의 뒤로가기. 눈에 띄게 알약 모양으로 두고, 아래 제목과 간격을 둔다.
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="mb-3 inline-flex items-center gap-0.5 rounded-full bg-muted py-1.5 pl-2 pr-3.5 text-sm font-medium text-foreground hover:bg-muted/70"
    >
      <ChevronLeftIcon className="size-4" />
      {children}
    </Link>
  );
}
