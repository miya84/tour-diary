-- 어드민 가입 허용 목록: 어드민이 허락한 이메일만 가입할 수 있다.
-- 1) app_admins: 어드민 계정. API로는 자기 행만 읽을 수 있고 바꿀 수 없다(SQL로만 관리).
-- 2) signup_allowlist: 가입할 수 있는 이메일. 소문자·앞뒤 공백 없는 값으로 저장한다. 어드민만 읽고 쓴다.
-- 3) hook_signup_allowlist: Supabase Auth의 Before User Created 훅. 목록에 없으면 403으로 거절한다.
--    이 함수는 대시보드 Authentication → Hooks에서 연결해야 동작한다.

create table public.app_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.signup_allowlist (
  email text primary key check (email = lower(btrim(email)) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  added_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index signup_allowlist_added_by_idx on public.signup_allowlist (added_by);

alter table public.app_admins enable row level security;
alter table public.signup_allowlist enable row level security;

-- 어드민 확인. RLS에서 쓰고, API에 노출되지 않는 private 스키마에 둔다.
create function private.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.app_admins a where a.user_id = (select auth.uid()));
$$;
revoke execute on function private.is_app_admin() from public, anon;
grant execute on function private.is_app_admin() to authenticated;

grant select on public.app_admins to authenticated;
create policy "app_admins: self select" on public.app_admins
  for select to authenticated using (user_id = (select auth.uid()));

grant select, insert, delete on public.signup_allowlist to authenticated;
create policy "signup_allowlist: admin select" on public.signup_allowlist
  for select to authenticated using (private.is_app_admin());
create policy "signup_allowlist: admin insert" on public.signup_allowlist
  for insert to authenticated with check (private.is_app_admin() and added_by = (select auth.uid()));
create policy "signup_allowlist: admin delete" on public.signup_allowlist
  for delete to authenticated using (private.is_app_admin());

-- ───────────── Before User Created 훅 ─────────────
-- Auth가 supabase_auth_admin 역할로 부른다. 목록을 읽을 수 있게 그 역할에만 읽기를 연다.
grant select on public.signup_allowlist to supabase_auth_admin;
create policy "signup_allowlist: auth admin reads" on public.signup_allowlist
  as permissive for select to supabase_auth_admin using (true);

create function public.hook_signup_allowlist(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_email text := lower(btrim(coalesce(event -> 'user' ->> 'email', '')));
begin
  if v_email <> '' and exists (select 1 from public.signup_allowlist a where a.email = v_email) then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', '초대받은 이메일만 가입할 수 있어요. 앱 관리자에게 이메일을 알려 주세요.'
    )
  );
end;
$$;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.hook_signup_allowlist(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_signup_allowlist(jsonb) from public, anon, authenticated;

-- 어드민: my.test@yopmail.com 계정. 계정이 없는 DB(로컬 등)에서는 건너뛴다.
insert into public.app_admins (user_id)
select id from auth.users where lower(email) = 'my.test@yopmail.com'
on conflict do nothing;
