import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// 요청마다 새로 만든다. 전역 변수에 담아 두지 않는다.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Component에서 호출되면 쿠키를 쓸 수 없다. proxy가 세션을 갱신하므로 무시한다.
          }
        },
      },
    },
  );
}

// 서버에서 검증한 현재 사용자. 로그인하지 않았으면 null.
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;
  return { id: claims.sub, email: (claims.email as string | undefined) ?? "" };
}
