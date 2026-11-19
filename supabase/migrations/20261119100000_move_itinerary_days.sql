-- 일정 이동. 둘 다 security invoker라서 일정 항목 수정 권한(멤버)을 그대로 따른다.
-- 옮길 날짜는 여행 기간 안이어야 한다. 기간 밖이거나 항목이 이 여행 것이 아니면 아무것도 바꾸지 않고 오류를 낸다.

-- 항목 하나를 다른 날 맨 끝으로 옮긴다.
create function public.move_itinerary_item(p_trip_id uuid, p_item_id uuid, p_day date)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not exists (select 1 from public.trips t where t.id = p_trip_id and p_day between t.start_date and t.end_date) then
    raise exception 'day_out_of_range';
  end if;

  update public.itinerary_items
  set day = p_day,
      position = (select coalesce(max(x.position) + 1, 0) from public.itinerary_items x where x.trip_id = p_trip_id and x.day = p_day)
  where id = p_item_id and trip_id = p_trip_id and day <> p_day;
  get diagnostics v_count = row_count;
  if v_count = 0 then
    raise exception 'item_not_moved';
  end if;
end;
$$;
revoke execute on function public.move_itinerary_item(uuid, uuid, date) from public, anon;
grant execute on function public.move_itinerary_item(uuid, uuid, date) to authenticated;

-- 두 날짜의 일정을 서로 바꾼다. 한쪽이 비어 있으면 다른 쪽 일정이 그냥 옮겨 간다. 각 날짜 안의 순서는 그대로다.
create function public.swap_itinerary_days(p_trip_id uuid, p_day_a date, p_day_b date)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_day_a = p_day_b then
    raise exception 'same_day';
  end if;
  if not exists (
    select 1 from public.trips t
    where t.id = p_trip_id
      and p_day_a between t.start_date and t.end_date
      and p_day_b between t.start_date and t.end_date
  ) then
    raise exception 'day_out_of_range';
  end if;

  update public.itinerary_items
  set day = case when day = p_day_a then p_day_b else p_day_a end
  where trip_id = p_trip_id and day in (p_day_a, p_day_b);
end;
$$;
revoke execute on function public.swap_itinerary_days(uuid, date, date) from public, anon;
grant execute on function public.swap_itinerary_days(uuid, date, date) to authenticated;
