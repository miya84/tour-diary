import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { mustChangePassword, RESET_PASSWORD_PATH } from "@/lib/password-reset-flag";

// 요청마다 Supabase 세션을 갱신하고, 로그인하지 않은 사용자를 로그인 화면으로 보낸다.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // createServerClient와 getClaims 사이에 다른 코드를 넣지 않는다(세션이 끊길 수 있다).
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims && !request.nextUrl.pathname.startsWith("/auth")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = "";
    const next = request.nextUrl.pathname + request.nextUrl.search;
    if (next !== "/") url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  // 어드민이 초기화한 계정은 새 비밀번호를 정하기 전까지 그 화면만 쓴다.
  if (mustChangePassword(data?.claims) && request.nextUrl.pathname !== RESET_PASSWORD_PATH) {
    const url = request.nextUrl.clone();
    url.pathname = RESET_PASSWORD_PATH;
    url.search = "";
    const redirect = NextResponse.redirect(url);
    // 갱신된 세션 쿠키를 잃지 않게 옮겨 담는다.
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}
