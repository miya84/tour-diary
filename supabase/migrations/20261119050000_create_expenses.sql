-- 경비 기록: 여행의 경비, 경비를 나눌 사람, 여행 환율. 멤버만 읽고 쓴다.
-- 낸 사람과 나눌 사람은 그 여행의 멤버여야 한다.

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 100),
  amount bigint not null check (amount > 0 and amount <= 1000000000),
  currency text not null check (currency in ('JPY', 'KRW')),
  paid_by uuid not null references auth.users (id) on delete cascade,
  spent_on date not null,
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now()
);
create index expenses_trip_id_spent_on_idx on public.expenses (trip_id, spent_on);
create index expenses_paid_by_idx on public.expenses (paid_by);

create table public.expense_shares (
  expense_id uuid not null references public.expenses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (expense_id, user_id)
);
create index expense_shares_user_id_idx on public.expense_shares (user_id);

-- 여행마다 하나. "100엔 = krw_per_100_jpy원".
create table public.trip_exchange_rates (
  trip_id uuid primary key references public.trips (id) on delete cascade,
  krw_per_100_jpy numeric(10, 2) not null check (krw_per_100_jpy > 0 and krw_per_100_jpy < 100000),
  updated_at timestamptz not null default now()
);

alter table public.expenses enable row level security;
alter table public.expense_shares enable row level security;
alter table public.trip_exchange_rates enable row level security;
grant select, insert, update, delete on public.expenses to authenticated;
grant select, insert, delete on public.expense_shares to authenticated;
grant select, insert, update on public.trip_exchange_rates to authenticated;

-- 어떤 사람이 그 여행의 멤버인지(나 말고 다른 사람도). 멤버만 물어볼 수 있다.
create function private.is_member_of(p_trip_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_trip_member(p_trip_id)
    and exists (select 1 from public.trip_members m where m.trip_id = p_trip_id and m.user_id = p_user_id);
$$;
revoke execute on function private.is_member_of(uuid, uuid) from public, anon;
grant execute on function private.is_member_of(uuid, uuid) to authenticated;

create policy "expenses: member select" on public.expenses
  for select to authenticated using (private.is_trip_member(trip_id));
create policy "expenses: member insert" on public.expenses
  for insert to authenticated with check (private.is_member_of(trip_id, paid_by));
create policy "expenses: member update" on public.expenses
  for update to authenticated
  using (private.is_trip_member(trip_id)) with check (private.is_member_of(trip_id, paid_by));
create policy "expenses: member delete" on public.expenses
  for delete to authenticated using (private.is_trip_member(trip_id));

create policy "expense_shares: member select" on public.expense_shares
  for select to authenticated
  using (exists (select 1 from public.expenses e where e.id = expense_id and private.is_trip_member(e.trip_id)));
create policy "expense_shares: member insert" on public.expense_shares
  for insert to authenticated
  with check (exists (select 1 from public.expenses e where e.id = expense_id and private.is_member_of(e.trip_id, user_id)));
create policy "expense_shares: member delete" on public.expense_shares
  for delete to authenticated
  using (exists (select 1 from public.expenses e where e.id = expense_id and private.is_trip_member(e.trip_id)));

create policy "trip_exchange_rates: member select" on public.trip_exchange_rates
  for select to authenticated using (private.is_trip_member(trip_id));
create policy "trip_exchange_rates: member insert" on public.trip_exchange_rates
  for insert to authenticated with check (private.is_trip_member(trip_id));
create policy "trip_exchange_rates: member update" on public.trip_exchange_rates
  for update to authenticated
  using (private.is_trip_member(trip_id)) with check (private.is_trip_member(trip_id));

-- 경비와 나눌 사람을 한 번에 저장한다(호출한 사람의 권한과 RLS로 실행).
-- p_expense_id가 null이면 새로 만들고, 있으면 고친 뒤 나눌 사람을 다시 넣는다.
create function public.save_expense(
  p_trip_id uuid,
  p_expense_id uuid,
  p_title text,
  p_amount bigint,
  p_currency text,
  p_paid_by uuid,
  p_spent_on date,
  p_note text,
  p_share_user_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if coalesce(cardinality(p_share_user_ids), 0) = 0 then
    raise exception 'no_shares';
  end if;

  if p_expense_id is null then
    insert into public.expenses (trip_id, title, amount, currency, paid_by, spent_on, note)
    values (p_trip_id, btrim(p_title), p_amount, p_currency, p_paid_by, p_spent_on, nullif(btrim(p_note), ''))
    returning id into v_id;
  else
    update public.expenses
    set title = btrim(p_title), amount = p_amount, currency = p_currency, paid_by = p_paid_by,
        spent_on = p_spent_on, note = nullif(btrim(p_note), '')
    where id = p_expense_id and trip_id = p_trip_id
    returning id into v_id;
    if v_id is null then
      raise exception 'not_found';
    end if;
    delete from public.expense_shares where expense_id = v_id;
  end if;

  insert into public.expense_shares (expense_id, user_id)
  select distinct v_id, u from unnest(p_share_user_ids) as u;

  return v_id;
end;
$$;
revoke execute on function public.save_expense(uuid, uuid, text, bigint, text, uuid, date, text, uuid[]) from public, anon;
grant execute on function public.save_expense(uuid, uuid, text, bigint, text, uuid, date, text, uuid[]) to authenticated;
