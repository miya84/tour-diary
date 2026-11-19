-- 실시간 반영.
-- 1) 여행 화면의 데이터 테이블을 Realtime(Postgres Changes) 발행에 넣는다. 받는 쪽은 RLS로 걸러진다.
-- 2) 수정 중 잠금은 Presence로 공유한다. 채널 이름은 'trip:<여행 id>'이고, 그 여행의 멤버만 들어간다.

alter publication supabase_realtime add table
  public.itinerary_items,
  public.bookings,
  public.booking_attachments,
  public.expenses,
  public.expense_shares,
  public.trip_exchange_rates,
  public.settlement_payments,
  public.polls,
  public.poll_options,
  public.poll_votes,
  public.trip_members;

-- 채널 이름이 'trip:<uuid>' 꼴이고 그 여행의 멤버일 때만 참. 꼴이 다르면 거짓이다.
create function private.is_trip_channel_member(p_topic text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select case
    when p_topic ~ '^trip:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then private.is_trip_member(substr(p_topic, 6)::uuid)
    else false
  end;
$$;
revoke execute on function private.is_trip_channel_member(text) from public, anon;
grant execute on function private.is_trip_channel_member(text) to authenticated;

-- realtime.messages는 RLS가 이미 켜져 있다(켜는 문장을 넣으면 소유자 오류가 난다).
create policy "trip presence: member receive" on realtime.messages
  for select to authenticated
  using (realtime.messages.extension = 'presence' and private.is_trip_channel_member((select realtime.topic())));

create policy "trip presence: member send" on realtime.messages
  for insert to authenticated
  with check (realtime.messages.extension = 'presence' and private.is_trip_channel_member((select realtime.topic())));
