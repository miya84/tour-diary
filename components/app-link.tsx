import NextLink from "next/link";

import { LinkPendingBar } from "./link-pending-bar";

// 앱 안에서 쓰는 링크. 누르는 순간부터 다음 화면이 뜰 때까지 화면 맨 위에 진행 막대를 보여 준다.
export default function AppLink({ children, ...props }: React.ComponentProps<typeof NextLink>) {
  return (
    <NextLink {...props}>
      {children}
      <LinkPendingBar />
    </NextLink>
  );
}
