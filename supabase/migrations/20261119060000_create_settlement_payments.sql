-- 경비 정산: 송금별 완료 표시. 멤버만 읽고 표시하고 푼다.
-- 송금은 (보낸 사람, 받는 사람, 금액)으로 정해진다. 경비가 바뀌어 금액이 달라지면
-- 새 송금은 이 표의 행과 맞지 않아 자연히 완료 전 상태가 된다.
-- 보낸 사람·받는 사람은 나간 멤버일 수 있어서 멤버 여부를 묻지 않는다.

create table public.settlement_payments (
  trip_id uuid not null references public.trips (id) on delete cascade,
  from_user uuid not null references auth.users (id) on delete cascade,
  to_user uuid not null references auth.users (id) on delete cascade,
  amount bigint not null check (amount > 0),
  marked_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (trip_id, from_user, to_user, amount),
  constraint settlement_payments_distinct_people check (from_user <> to_user)
);
create index settlement_payments_marked_by_idx on public.settlement_payments (marked_by);

alter table public.settlement_payments enable row level security;
grant select, insert, delete on public.settlement_payments to authenticated;

create policy "settlement_payments: member select" on public.settlement_payments
  for select to authenticated using (private.is_trip_member(trip_id));
create policy "settlement_payments: member insert" on public.settlement_payments
  for insert to authenticated
  with check (private.is_trip_member(trip_id) and marked_by = (select auth.uid()));
create policy "settlement_payments: member delete" on public.settlement_payments
  for delete to authenticated using (private.is_trip_member(trip_id));
