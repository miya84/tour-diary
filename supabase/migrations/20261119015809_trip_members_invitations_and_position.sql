-- 멤버·초대와 순서 변경.
-- 1) 여행은 만든 사람과 초대를 수락한 멤버만 보고 편집한다.
-- 2) 초대는 가입된 회원의 이메일로만, 수락해야 멤버가 된다.
-- 3) 하루 안의 순서는 사용자가 바꿀 수 있는 position으로 저장한다.

-- ───────────── 순서(position) ─────────────
alter table public.itinerary_items add column position integer;

update public.itinerary_items i
set position = r.rn - 1
from (
  select id, row_number() over (partition by trip_id, day order by seq) as rn
  from public.itinerary_items
) r
where r.id = i.id;

alter table public.itinerary_items alter column position set not null;
drop index public.itinerary_items_trip_day_seq_idx;
alter table public.itinerary_items drop column seq;
create index itinerary_items_trip_day_position_idx on public.itinerary_items (trip_id, day, position);

-- ───────────── 멤버와 초대 ─────────────
create table public.trip_members (
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'editor')),
  created_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);
create index trip_members_user_id_idx on public.trip_members (user_id);

-- 행이 있으면 수락 대기 중인 초대다. 수락·거절·취소하면 행을 지운다.
create table public.trip_invitations (
  trip_id uuid not null references public.trips (id) on delete cascade,
  invitee_id uuid not null references auth.users (id) on delete cascade,
  invited_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (trip_id, invitee_id)
);
create index trip_invitations_invitee_id_idx on public.trip_invitations (invitee_id);

alter table public.trip_members enable row level security;
alter table public.trip_invitations enable row level security;
grant select, insert, delete on public.trip_members to authenticated;
grant select, delete on public.trip_invitations to authenticated;

-- RLS에서 쓰는 멤버 확인. trip_members 정책이 자기 자신을 다시 조회하며 무한 반복하지 않도록
-- API에 노출되지 않는 private 스키마의 security definer 함수로 둔다.
create schema if not exists private;
grant usage on schema private to authenticated;

create function private.is_trip_member(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.trip_members m
    where m.trip_id = p_trip_id and m.user_id = (select auth.uid())
  );
$$;
revoke execute on function private.is_trip_member(uuid) from public, anon;
grant execute on function private.is_trip_member(uuid) to authenticated;

create function private.is_trip_owner(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.trips t
    where t.id = p_trip_id and t.user_id = (select auth.uid())
  );
$$;
revoke execute on function private.is_trip_owner(uuid) from public, anon;
grant execute on function private.is_trip_owner(uuid) to authenticated;

-- 여행을 만들면 만든 사람을 owner 멤버로 넣는다.
create function private.add_trip_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.trip_members (trip_id, user_id, role) values (new.id, new.user_id, 'owner');
  return new;
end;
$$;
revoke execute on function private.add_trip_owner() from public, anon, authenticated;

create trigger trips_add_owner after insert on public.trips
  for each row execute function private.add_trip_owner();

-- 이미 있는 여행의 만든 사람도 멤버로 넣는다.
insert into public.trip_members (trip_id, user_id, role)
select id, user_id, 'owner' from public.trips
on conflict do nothing;

-- ───────────── 접근 규칙(RLS) 다시 만들기 ─────────────
drop policy "trips: owner select" on public.trips;
drop policy "itinerary_items: owner select" on public.itinerary_items;
drop policy "itinerary_items: owner insert" on public.itinerary_items;
drop policy "itinerary_items: owner update" on public.itinerary_items;
drop policy "itinerary_items: owner delete" on public.itinerary_items;

-- trips: 멤버는 볼 수 있고, 만들기·수정·삭제는 기존처럼 만든 사람 기준이다.
-- (만든 직후 insert ... returning 이 보이도록 만든 사람도 함께 허용한다.)
create policy "trips: member select" on public.trips
  for select to authenticated
  using ((select auth.uid()) = user_id or private.is_trip_member(id));

-- itinerary_items: 멤버면 모두 할 수 있다.
create policy "itinerary_items: member select" on public.itinerary_items
  for select to authenticated using (private.is_trip_member(trip_id));
create policy "itinerary_items: member insert" on public.itinerary_items
  for insert to authenticated with check (private.is_trip_member(trip_id));
create policy "itinerary_items: member update" on public.itinerary_items
  for update to authenticated
  using (private.is_trip_member(trip_id)) with check (private.is_trip_member(trip_id));
create policy "itinerary_items: member delete" on public.itinerary_items
  for delete to authenticated using (private.is_trip_member(trip_id));

-- trip_members: 같은 여행 멤버끼리 볼 수 있다.
create policy "trip_members: member select" on public.trip_members
  for select to authenticated using (private.is_trip_member(trip_id));
-- 본인 앞으로 온 초대가 있을 때만 자신을 editor로 넣을 수 있다(수락).
create policy "trip_members: accept invitation" on public.trip_members
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and role = 'editor'
    and exists (
      select 1 from public.trip_invitations v
      where v.trip_id = trip_members.trip_id and v.invitee_id = (select auth.uid())
    )
  );
-- 만든 사람만 editor를 내보낼 수 있다.
create policy "trip_members: owner removes editor" on public.trip_members
  for delete to authenticated
  using (role = 'editor' and private.is_trip_owner(trip_id));

-- trip_invitations: 받은 사람과 만든 사람이 보고 지울 수 있다(거절·취소). 만들기는 아래 함수로만 한다.
create policy "trip_invitations: invitee or owner select" on public.trip_invitations
  for select to authenticated
  using (invitee_id = (select auth.uid()) or private.is_trip_owner(trip_id));
create policy "trip_invitations: invitee or owner delete" on public.trip_invitations
  for delete to authenticated
  using (invitee_id = (select auth.uid()) or private.is_trip_owner(trip_id));

-- ───────────── 앱이 부르는 함수 ─────────────

-- 가입된 회원의 이메일로 초대한다. 이메일로 회원을 찾으려면 auth.users를 읽어야 해서 security definer다.
-- 만든 사람인지 함수 안에서 먼저 확인한다. 실패하면 이유를 오류 메시지 코드로 돌려준다.
create function public.invite_to_trip(p_trip_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitee uuid;
begin
  if not private.is_trip_owner(p_trip_id) then
    raise exception 'not_owner';
  end if;

  select u.id into v_invitee from auth.users u where lower(u.email) = lower(btrim(p_email));
  if v_invitee is null then
    raise exception 'not_registered';
  end if;
  if exists (select 1 from public.trip_members m where m.trip_id = p_trip_id and m.user_id = v_invitee) then
    raise exception 'already_member';
  end if;
  if exists (select 1 from public.trip_invitations v where v.trip_id = p_trip_id and v.invitee_id = v_invitee) then
    raise exception 'already_invited';
  end if;

  insert into public.trip_invitations (trip_id, invitee_id, invited_by)
  values (p_trip_id, v_invitee, (select auth.uid()));
end;
$$;
revoke execute on function public.invite_to_trip(uuid, text) from public, anon;
grant execute on function public.invite_to_trip(uuid, text) to authenticated;

-- 받은 초대를 수락한다. security invoker라서 위 RLS가 그대로 적용된다.
create function public.accept_trip_invitation(p_trip_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.trip_members (trip_id, user_id, role)
  values (p_trip_id, (select auth.uid()), 'editor');
  delete from public.trip_invitations
  where trip_id = p_trip_id and invitee_id = (select auth.uid());
end;
$$;
revoke execute on function public.accept_trip_invitation(uuid) from public, anon;
grant execute on function public.accept_trip_invitation(uuid) to authenticated;

-- 내가 받은 초대. 수락 전에는 여행을 볼 수 없으므로 제목·기간·초대한 사람 이메일만 돌려준다.
create function public.list_my_invitations()
returns table (trip_id uuid, title text, start_date date, end_date date, inviter_email text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select t.id, t.title, t.start_date, t.end_date, u.email::text, v.created_at
  from public.trip_invitations v
  join public.trips t on t.id = v.trip_id
  join auth.users u on u.id = v.invited_by
  where v.invitee_id = (select auth.uid())
  order by v.created_at desc;
$$;
revoke execute on function public.list_my_invitations() from public, anon;
grant execute on function public.list_my_invitations() to authenticated;

-- 여행의 멤버와 수락 대기 초대. 멤버만 볼 수 있다.
create function public.list_trip_members(p_trip_id uuid)
returns table (user_id uuid, email text, role text, status text)
language sql
stable
security definer
set search_path = ''
as $$
  select m.user_id, u.email::text, m.role, 'member'
  from public.trip_members m join auth.users u on u.id = m.user_id
  where m.trip_id = p_trip_id and private.is_trip_member(p_trip_id)
  union all
  select v.invitee_id, u.email::text, 'editor', 'pending'
  from public.trip_invitations v join auth.users u on u.id = v.invitee_id
  where v.trip_id = p_trip_id and private.is_trip_member(p_trip_id);
$$;
revoke execute on function public.list_trip_members(uuid) from public, anon;
grant execute on function public.list_trip_members(uuid) to authenticated;

-- 한 날짜의 순서를 한 번에 바꾼다. p_ids 배열의 순서가 새 순서다(RLS 적용).
create function public.reorder_itinerary_items(p_trip_id uuid, p_day date, p_ids uuid[])
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.itinerary_items i
  set position = o.ord - 1
  from unnest(p_ids) with ordinality as o(id, ord)
  where i.id = o.id and i.trip_id = p_trip_id and i.day = p_day;
$$;
revoke execute on function public.reorder_itinerary_items(uuid, date, uuid[]) from public, anon;
grant execute on function public.reorder_itinerary_items(uuid, date, uuid[]) to authenticated;
