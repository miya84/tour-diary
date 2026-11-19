-- 예약함: 여행의 예약과 첨부 이미지. 멤버만 읽고 쓴다.
-- 첨부 파일은 비공개 Storage 버킷에 두고, 경로의 첫 칸(여행 id)으로 멤버인지 확인한다.

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  kind text not null check (kind in ('flight', 'lodging', 'transport', 'ticket', 'meal', 'other')),
  title text not null check (char_length(btrim(title)) > 0),
  booking_date date,
  reference text,
  note text check (char_length(note) <= 5000),
  created_at timestamptz not null default now()
);
create index bookings_trip_id_idx on public.bookings (trip_id);

create table public.booking_attachments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  path text not null unique,
  created_at timestamptz not null default now()
);
create index booking_attachments_booking_id_idx on public.booking_attachments (booking_id);

alter table public.bookings enable row level security;
alter table public.booking_attachments enable row level security;
grant select, insert, update, delete on public.bookings to authenticated;
grant select, insert, delete on public.booking_attachments to authenticated;

create policy "bookings: member select" on public.bookings
  for select to authenticated using (private.is_trip_member(trip_id));
create policy "bookings: member insert" on public.bookings
  for insert to authenticated with check (private.is_trip_member(trip_id));
create policy "bookings: member update" on public.bookings
  for update to authenticated
  using (private.is_trip_member(trip_id)) with check (private.is_trip_member(trip_id));
create policy "bookings: member delete" on public.bookings
  for delete to authenticated using (private.is_trip_member(trip_id));

create policy "booking_attachments: member select" on public.booking_attachments
  for select to authenticated using (private.is_trip_member(trip_id));
-- 예약당 5개까지. 첨부의 trip_id가 예약의 여행과 같아야 한다.
create policy "booking_attachments: member insert" on public.booking_attachments
  for insert to authenticated
  with check (
    private.is_trip_member(trip_id)
    and exists (select 1 from public.bookings b where b.id = booking_id and b.trip_id = booking_attachments.trip_id)
    and (select count(*) from public.booking_attachments a where a.booking_id = booking_attachments.booking_id) < 5
  );
create policy "booking_attachments: member delete" on public.booking_attachments
  for delete to authenticated using (private.is_trip_member(trip_id));

-- ───────────── Storage ─────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('booking-attachments', 'booking-attachments', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- 파일 경로는 <trip_id>/<booking_id>/<파일명>. 첫 칸이 uuid가 아니면 접근할 수 없다.
create function private.storage_trip_member(p_name text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select case
    when (storage.foldername(p_name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then private.is_trip_member(((storage.foldername(p_name))[1])::uuid)
    else false
  end;
$$;
revoke execute on function private.storage_trip_member(text) from public, anon;
grant execute on function private.storage_trip_member(text) to authenticated;

create policy "booking files: member select" on storage.objects
  for select to authenticated
  using (bucket_id = 'booking-attachments' and private.storage_trip_member(name));
create policy "booking files: member insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'booking-attachments' and private.storage_trip_member(name));
create policy "booking files: member delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'booking-attachments' and private.storage_trip_member(name));
