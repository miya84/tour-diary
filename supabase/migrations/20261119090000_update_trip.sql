-- 여행 제목·기간 수정. 기간을 줄여 새 기간 밖에 놓인 일정 항목·경비·진행 중인 투표는
-- 가까운 끝 날짜(앞쪽은 첫날, 뒤쪽은 마지막 날)로 옮긴다. 여행 저장과 이동은 함께 되거나 함께 안 된다.
-- 일정 항목은 옮긴 날짜의 맨 끝에 원래 순서대로 붙는다. 마감된 투표와 예약 날짜는 옮기지 않는다.
-- security definer이므로 함수 안에서 만든 사람인지 먼저 확인한다(투표 수정 권한이 일반 멤버에게 없어서 필요하다).
create function public.update_trip(p_trip_id uuid, p_title text, p_start date, p_end date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_trip_owner(p_trip_id) then
    raise exception 'not_owner';
  end if;
  if char_length(btrim(p_title)) = 0 then
    raise exception 'invalid_title';
  end if;
  if p_end < p_start then
    raise exception 'invalid_range';
  end if;

  update public.trips set title = btrim(p_title), start_date = p_start, end_date = p_end where id = p_trip_id;

  update public.itinerary_items i
  set day = o.new_day, position = o.base + o.rn - 1
  from (
    select s.id, s.new_day, s.rn,
      coalesce((select max(x.position) + 1 from public.itinerary_items x where x.trip_id = p_trip_id and x.day = s.new_day), 0) as base
    from (
      select id, least(greatest(day, p_start), p_end) as new_day,
        row_number() over (partition by least(greatest(day, p_start), p_end) order by day, position) as rn
      from public.itinerary_items
      where trip_id = p_trip_id and (day < p_start or day > p_end)
    ) s
  ) o
  where i.id = o.id;

  update public.expenses
  set spent_on = least(greatest(spent_on, p_start), p_end)
  where trip_id = p_trip_id and (spent_on < p_start or spent_on > p_end);

  update public.polls
  set day = least(greatest(day, p_start), p_end)
  where trip_id = p_trip_id and status = 'open' and (day < p_start or day > p_end);
end;
$$;
revoke execute on function public.update_trip(uuid, text, date, date) from public, anon;
grant execute on function public.update_trip(uuid, text, date, date) to authenticated;
