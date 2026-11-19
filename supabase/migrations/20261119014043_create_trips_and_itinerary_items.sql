-- 여행(trips)과 일정 항목(itinerary_items). 이번 조각은 만든 본인만 읽고 쓴다.

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  constraint trips_dates_check check (end_date >= start_date)
);

create index trips_user_id_idx on public.trips (user_id);

create table public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  day date not null,
  title text not null check (length(btrim(title)) > 0),
  start_time time,
  note text,
  place_id text,
  place_name text,
  lat double precision,
  lng double precision,
  -- 하루 안의 순서는 추가한 순서다.
  seq bigint generated always as identity,
  created_at timestamptz not null default now(),
  -- 장소는 선택이지만, 붙일 때는 이름과 좌표가 함께 있어야 한다.
  constraint itinerary_items_place_check check (
    (place_id is null and place_name is null and lat is null and lng is null)
    or (place_id is not null and place_name is not null and lat is not null and lng is not null)
  )
);

create index itinerary_items_trip_day_seq_idx on public.itinerary_items (trip_id, day, seq);

alter table public.trips enable row level security;
alter table public.itinerary_items enable row level security;

grant select, insert, update, delete on public.trips to authenticated;
grant select, insert, update, delete on public.itinerary_items to authenticated;

create policy "trips: owner select" on public.trips
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "trips: owner insert" on public.trips
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "trips: owner update" on public.trips
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "trips: owner delete" on public.trips
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- 일정 항목은 자신이 소유한 여행에 속할 때만 다룰 수 있다.
create policy "itinerary_items: owner select" on public.itinerary_items
  for select to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and t.user_id = (select auth.uid())
    )
  );

create policy "itinerary_items: owner insert" on public.itinerary_items
  for insert to authenticated
  with check (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and t.user_id = (select auth.uid())
    )
  );

create policy "itinerary_items: owner update" on public.itinerary_items
  for update to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and t.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and t.user_id = (select auth.uid())
    )
  );

create policy "itinerary_items: owner delete" on public.itinerary_items
  for delete to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and t.user_id = (select auth.uid())
    )
  );
