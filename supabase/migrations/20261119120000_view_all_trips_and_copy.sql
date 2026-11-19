-- 가입한 회원은 모든 여행의 여행 정보와 일정 항목을 읽을 수 있다(수정은 지금처럼 멤버·만든 사람만).
-- 예약·경비·정산·투표·멤버 규칙은 건드리지 않아 멤버에게만 보인다.
-- 여행 복사 함수 copy_trip을 만든다.

drop policy "trips: member select" on public.trips;
create policy "trips: authenticated select" on public.trips
  for select to authenticated using (true);

drop policy "itinerary_items: member select" on public.itinerary_items;
create policy "itinerary_items: authenticated select" on public.itinerary_items
  for select to authenticated using (true);

-- 다른 사람의 여행 카드에 "○○님이 만든 여행"을 보이려고, 여행을 만든 사람의 닉네임을 읽게 한다.
create policy "profiles: trip owner select" on public.profiles
  for select to authenticated
  using (exists (select 1 from public.trips t where t.user_id = profiles.id));

-- 여행 복사. 원래 여행의 일정 항목(제목·장소·시작 시간·메모·하루 안 순서)을 새 시작일 기준 같은 날짜 위치로 가져온다.
-- 새 여행은 내가 만든 사람이다(멤버로 들어가는 일은 여행 만들기 트리거가 한다). 예약·경비·투표·멤버는 복사하지 않는다.
-- security invoker라서 내 권한으로 새 여행과 일정을 만들고, 읽기 권한이 있는 여행만 복사할 수 있다.
create function public.copy_trip(p_source_id uuid, p_title text, p_start date)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_source public.trips;
  v_new_id uuid;
begin
  if char_length(btrim(p_title)) = 0 then
    raise exception 'invalid_title';
  end if;

  select * into v_source from public.trips where id = p_source_id;
  if not found then
    raise exception 'source_not_found';
  end if;

  insert into public.trips (title, start_date, end_date)
  values (btrim(p_title), p_start, p_start + (v_source.end_date - v_source.start_date))
  returning id into v_new_id;

  insert into public.itinerary_items (trip_id, day, title, start_time, note, place_id, place_name, lat, lng, position)
  select v_new_id,
         p_start + (least(greatest(i.day, v_source.start_date), v_source.end_date) - v_source.start_date),
         i.title, i.start_time, i.note, i.place_id, i.place_name, i.lat, i.lng, i.position
  from public.itinerary_items i
  where i.trip_id = p_source_id;

  return v_new_id;
end;
$$;
revoke execute on function public.copy_trip(uuid, text, date) from public, anon;
grant execute on function public.copy_trip(uuid, text, date) to authenticated;
