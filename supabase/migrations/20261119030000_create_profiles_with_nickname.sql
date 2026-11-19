-- 유저 프로필과 닉네임.
-- 1) 가입하면 닉네임(기본값: 이메일 앞부분)이 든 프로필이 만들어진다. 이미 있는 계정도 채운다.
-- 2) 본인만 닉네임을 바꾼다. 같은 여행의 멤버끼리는 닉네임을 읽을 수 있다.
-- 3) 멤버 목록·받은 초대 함수가 이메일 대신 닉네임을 돌려준다.
-- 이메일은 프로필에 복사하지 않는다. 본인 이메일은 로그인 정보에서 읽고, 다른 사람 이메일은 노출하지 않는다.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null check (char_length(btrim(nickname)) between 1 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 마지막 수정 시각은 DB가 올린다.
create function private.touch_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.created_at := old.created_at;
  return new;
end;
$$;
create trigger profiles_touch_updated_at before update on public.profiles
  for each row execute function private.touch_profile_updated_at();

-- 이메일 앞부분을 20자까지 잘라 기본 닉네임으로 쓴다. 비면 '여행자'.
create function private.default_nickname(p_email text)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    nullif(left(btrim(split_part(coalesce(p_email, ''), '@', 1)), 20), ''),
    '여행자'
  );
$$;

-- 가입하면 프로필을 만든다.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nickname) values (new.id, private.default_nickname(new.email));
  return new;
end;
$$;
revoke execute on function private.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- 이미 있는 계정의 프로필을 채운다.
insert into public.profiles (id, nickname)
select u.id, private.default_nickname(u.email) from auth.users u
on conflict do nothing;

-- 같은 여행의 멤버이거나 수락 대기 초대를 주고받은 사이인지. RLS에서 쓴다.
create function private.shares_trip_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1
      from public.trip_members a join public.trip_members b on a.trip_id = b.trip_id
      where a.user_id = (select auth.uid()) and b.user_id = p_user_id
    )
    or exists (
      select 1 from public.trip_invitations v
      where (v.invitee_id = (select auth.uid()) and v.invited_by = p_user_id)
         or (v.invited_by = (select auth.uid()) and v.invitee_id = p_user_id)
    );
$$;
revoke execute on function private.shares_trip_with(uuid) from public, anon;
grant execute on function private.shares_trip_with(uuid) to authenticated;

alter table public.profiles enable row level security;

-- 본인은 닉네임만 수정할 수 있다(컬럼 권한). 읽기는 본인과 같은 여행 사람.
grant select on public.profiles to authenticated;
grant update (nickname) on public.profiles to authenticated;

create policy "profiles: self or trip mate select" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or private.shares_trip_with(id));
create policy "profiles: self update" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ───────────── 이메일 대신 닉네임을 돌려주도록 함수 바꾸기 ─────────────

drop function public.list_my_invitations();
create function public.list_my_invitations()
returns table (trip_id uuid, title text, start_date date, end_date date, inviter_nickname text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select t.id, t.title, t.start_date, t.end_date, p.nickname, v.created_at
  from public.trip_invitations v
  join public.trips t on t.id = v.trip_id
  join public.profiles p on p.id = v.invited_by
  where v.invitee_id = (select auth.uid())
  order by v.created_at desc;
$$;
revoke execute on function public.list_my_invitations() from public, anon;
grant execute on function public.list_my_invitations() to authenticated;

drop function public.list_trip_members(uuid);
create function public.list_trip_members(p_trip_id uuid)
returns table (user_id uuid, nickname text, role text, status text)
language sql
stable
security definer
set search_path = ''
as $$
  select m.user_id, p.nickname, m.role, 'member'
  from public.trip_members m join public.profiles p on p.id = m.user_id
  where m.trip_id = p_trip_id and private.is_trip_member(p_trip_id)
  union all
  select v.invitee_id, p.nickname, 'editor', 'pending'
  from public.trip_invitations v join public.profiles p on p.id = v.invitee_id
  where v.trip_id = p_trip_id and private.is_trip_member(p_trip_id);
$$;
revoke execute on function public.list_trip_members(uuid) from public, anon;
grant execute on function public.list_trip_members(uuid) to authenticated;
