-- 경비 통화에 미국 달러(USD)와 베트남 동(VND)을 더한다.
-- 금액은 통화의 가장 작은 단위 정수로 저장한다(달러는 센트, 나머지는 그대로).
alter table public.expenses drop constraint expenses_currency_check;
alter table public.expenses
  add constraint expenses_currency_check check (currency in ('JPY', 'USD', 'VND', 'KRW'));

-- 여행 환율은 통화마다 따로 넣는다. 엔만 쓰는 여행도 있으니 모두 비워 둘 수 있다.
-- "1달러 = krw_per_1_usd원", "100동 = krw_per_100_vnd원".
alter table public.trip_exchange_rates
  alter column krw_per_100_jpy drop not null,
  add column krw_per_1_usd numeric(10, 2) check (krw_per_1_usd > 0 and krw_per_1_usd < 100000),
  add column krw_per_100_vnd numeric(10, 2) check (krw_per_100_vnd > 0 and krw_per_100_vnd < 100000);
