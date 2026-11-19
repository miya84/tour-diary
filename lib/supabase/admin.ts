import "server-only";

import { createClient } from "@supabase/supabase-js";

// 서버 전용 관리자 클라이언트(secret key). RLS를 건너뛰므로 어드민 확인을 마친 서버 동작에서만 쓴다.
// 요청마다 새로 만들고, 세션을 저장하지 않는다.
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY가 설정되지 않았습니다.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
