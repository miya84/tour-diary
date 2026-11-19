-- 후보지 투표: 투표(질문+반영 날짜), 후보, 표. 멤버만 읽고 쓴다.
-- 마감은 close_poll 함수 한 번으로 한다. 정해진 후보를 일정 항목으로 넣는 일까지 함께 처리한다.

create table public.polls (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  question text not null check (char_length(btrim(question)) > 0 and char_length(question) <= 100),
  day date not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  closed_option_id uuid,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  closed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);
create index polls_trip_id_idx on public.polls (trip_id);

create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  title text not null check (char_length(btrim(title)) > 0 and char_length(title) <= 100),
  place_id text,
  place_name text,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now(),
  unique (poll_id, id),
  constraint poll_options_place_check check (
    (place_id is null and place_name is null and lat is null and lng is null)
    or (place_id is not null and place_name is not null and lat is not null and lng is not null)
  )
);
create index poll_options_poll_id_idx on public.poll_options (poll_id);

alter table public.polls
  add constraint polls_closed_option_fkey foreign key (closed_option_id) references public.poll_options (id);

-- 한 사람은 한 투표에 한 행만 가진다(1인 1표). 표의 후보는 같은 투표의 후보여야 한다.
create table public.poll_votes (
  poll_id uuid not null references public.polls (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  option_id uuid not null,
  updated_at timestamptz not null default now(),
  primary key (poll_id, user_id),
  foreign key (poll_id, option_id) references public.poll_options (poll_id, id) on delete cascade
);
create index poll_votes_option_id_idx on public.poll_votes (option_id);

alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
grant select, insert, delete on public.polls to authenticated;
grant select, insert on public.poll_options to authenticated;
grant select, insert, update on public.poll_votes to authenticated;

-- polls: 마감(update)은 close_poll 함수로만 한다.
create policy "polls: member select" on public.polls
  for select to authenticated using (private.is_trip_member(trip_id));
create policy "polls: member insert" on public.polls
  for insert to authenticated
  with check (private.is_trip_member(trip_id) and created_by = (select auth.uid()) and status = 'open');
create policy "polls: member delete" on public.polls
  for delete to authenticated using (private.is_trip_member(trip_id));

-- poll_options: 열린 투표에만 올릴 수 있고, trip_id가 투표의 여행과 같아야 한다.
create policy "poll_options: member select" on public.poll_options
  for select to authenticated using (private.is_trip_member(trip_id));
create policy "poll_options: member insert" on public.poll_options
  for insert to authenticated
  with check (
    private.is_trip_member(trip_id)
    and exists (
      select 1 from public.polls p
      where p.id = poll_id and p.trip_id = poll_options.trip_id and p.status = 'open'
    )
  );

-- poll_votes: 내 표만, 열린 투표에서만 던지고 옮긴다.
create policy "poll_votes: member select" on public.poll_votes
  for select to authenticated
  using (exists (select 1 from public.polls p where p.id = poll_id and private.is_trip_member(p.trip_id)));
create policy "poll_votes: own insert" on public.poll_votes
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.polls p where p.id = poll_id and p.status = 'open' and private.is_trip_member(p.trip_id))
  );
create policy "poll_votes: own update" on public.poll_votes
  for update to authenticated
  using (
    user_id = (select auth.uid())
    and exists (select 1 from public.polls p where p.id = poll_id and p.status = 'open' and private.is_trip_member(p.trip_id))
  )
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.polls p where p.id = poll_id and p.status = 'open' and private.is_trip_member(p.trip_id))
  );

-- ───────────── 마감 ─────────────
-- 최고 득표 후보가 하나면 그 후보가, 동률(표가 없는 경우 포함)이면 p_option_id로 고른 동률 후보가 정해진다.
-- 정해진 후보는 투표의 날짜 맨 끝에 일정 항목으로 들어가고, 투표는 마감된다. 둘은 함께 되거나 함께 안 된다.
-- security definer이므로 함수 안에서 멤버인지 먼저 확인한다.
create function public.close_poll(p_poll_id uuid, p_option_id uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_poll public.polls;
  v_top uuid[];
  v_winner uuid;
  v_opt public.poll_options;
  v_position integer;
begin
  select * into v_poll from public.polls where id = p_poll_id for update;
  if not found or not private.is_trip_member(v_poll.trip_id) then
    raise exception 'poll_not_found';
  end if;
  if v_poll.status <> 'open' then
    raise exception 'poll_closed';
  end if;

  select array_agg(t.id) into v_top
  from (
    select o.id, count(v.user_id) as n, max(count(v.user_id)) over () as mx
    from public.poll_options o
    left join public.poll_votes v on v.option_id = o.id
    where o.poll_id = p_poll_id
    group by o.id
  ) t
  where t.n = t.mx;

  if v_top is null then
    raise exception 'no_options';
  end if;
  if array_length(v_top, 1) = 1 then
    v_winner := v_top[1];
  elsif p_option_id is not null and p_option_id = any (v_top) then
    v_winner := p_option_id;
  else
    raise exception 'tie_needs_choice';
  end if;

  select * into v_opt from public.poll_options where id = v_winner;
  select coalesce(max(position) + 1, 0) into v_position
  from public.itinerary_items where trip_id = v_poll.trip_id and day = v_poll.day;

  insert into public.itinerary_items (trip_id, day, title, place_id, place_name, lat, lng, position)
  values (v_poll.trip_id, v_poll.day, v_opt.title, v_opt.place_id, v_opt.place_name, v_opt.lat, v_opt.lng, v_position);

  update public.polls
  set status = 'closed', closed_option_id = v_winner, closed_by = (select auth.uid()), closed_at = now()
  where id = p_poll_id;
end;
$$;
revoke execute on function public.close_poll(uuid, uuid) from public, anon;
grant execute on function public.close_poll(uuid, uuid) to authenticated;
