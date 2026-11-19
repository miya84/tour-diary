-- 테스트용 데이터: 기존 후쿠오카 여행 수첩(ChatGPT 사이트)의 4일 일정을 옮겨 온다.
-- 실행: supabase db query --remote --file supabase/seeds/fukuoka-trip.sql
-- 소유자는 아래 닉네임의 계정이다. 실행할 때마다 새 여행이 하나 더 생긴다.
-- 장소 ID와 좌표는 Places API(New)에서 2026-11-19에 조회했다.

begin;

with owner as (
  select id from public.profiles where nickname = '미야♥'
),
trip as (
  insert into public.trips (user_id, title, start_date, end_date)
  select id, '후쿠오카 여행 수첩', date '2026-12-12', date '2026-12-15' from owner
  returning id
)
insert into public.itinerary_items (trip_id, day, position, title, start_time, note, place_id, place_name, lat, lng)
select trip.id, v.day::date, v.pos - 1, v.title, v.t::time, v.note, v.pid, v.pname, v.lat::double precision, v.lng::double precision
from trip, (values
  -- 12/12 토 · 유후인
  ('2026-12-12',  1, '후쿠오카행 (쏭 · 티웨이)', '08:20', '항공 08:20–09:25', null, null, null, null),
  ('2026-12-12',  2, '후쿠오카행 (석 & 썬 · 이스타)', '08:40', '항공 08:40–10:20', null, null, null, null),
  ('2026-12-12',  3, '공항 → 유후인 버스 이동', '12:08', '120분 · 예약 완료', null, null, null, null),
  ('2026-12-12',  4, '유후인 코토부키 하나노쇼 (짐 맡기기)', null, '12/12–13 · 마운틴뷰 재패니즈 스타일 · 석식(가이세키), 조식 포함', 'ChIJ6af-cNmtRjURUcwc1lylbzw', '유후인 코토부키 하나노쇼', '33.260369', '131.356731'),
  ('2026-12-12',  5, '이온마트 ATM', null, '현금 인출 후 소품샵 거리 산책', 'ChIJJWFAz9mtRjURI4G-3yc6V_8', '이온 유후인점', '33.26181', '131.358089'),
  ('2026-12-12',  6, '동구리노모리', null, '점심 무렵 산책', 'ChIJk5sUVX-uRjURmeoM99Rz7KM', '도토리의숲 유후인점', '33.266208', '131.361235'),
  ('2026-12-12',  7, '플로랄빌리지', null, '귀여운 캐릭터 굿즈 판매', 'ChIJWax-bn6uRjUReLLmqHrObCU', '유후인 플로랄빌리지', '33.267487', '131.365536'),
  ('2026-12-12',  8, 'THE HIDEOUT', null, '해리포터 분위기 가게', 'ChIJxbqnb36uRjURru2n-_Eps0o', 'ＴＨＥ ＨＩＤＥＯＵＴ', '33.267384', '131.365348'),
  ('2026-12-12',  9, '금상 고로케', null, '점심 · 주변 음식', 'ChIJaadjbX6uRjURi_pn3I7qpwM', '유후인 금상고로케', '33.267555', '131.365723'),
  ('2026-12-12', 10, '기린코 호수', null, null, 'ChIJa7QFnn2uRjUR5ofN82Ctd44', '긴린코', '33.266664', '131.369027'),
  ('2026-12-12', 11, '이온 유후인점', null, '저녁 간식, 음료', 'ChIJJWFAz9mtRjURI4G-3yc6V_8', '이온 유후인점', '33.26181', '131.358089'),
  ('2026-12-12', 12, '료칸 저녁과 온천', null, '저녁 · 가이세키, 온천', 'ChIJ6af-cNmtRjURUcwc1lylbzw', '유후인 코토부키 하나노쇼', '33.260369', '131.356731'),

  -- 12/13 일 · 하카타
  ('2026-12-13',  1, '료칸 조식', '07:00', null, null, null, null, null),
  ('2026-12-13',  2, '유후인 → 하카타 버스 이동', '09:00', '예약 완료 · 버스 이동 후 택시로 숙소까지', null, null, null, null),
  ('2026-12-13',  3, '히츠마부시빈초', '12:30', '점심 · 한 달 전 구글 예약 계획', 'ChIJ-wPKXuuRQTURN81TXfGamjs', '히츠마부시 빈쵸', '33.595758', '130.406248'),
  ('2026-12-13',  4, '캐널시티', null, '알펜 후쿠오카(할인쿠폰), 아식스(2층), 아크테릭스, 몽벨, 스노우피크(3층), 이토킹 도라야키(지하1층), 지브리샵, 마츠모토키요시(드럭)', 'ChIJYcOBiZWRQTUR0Rl0ehe67eA', '캐널시티 하카타', '33.58963', '130.410948'),
  ('2026-12-13',  5, 'Fuk Coffee', null, '캐널시티 근처에서 푸딩', 'ChIJeVtFF5GRQTURTQeXJPsp99o', 'Fuk Coffee', '33.590817', '130.412787'),
  ('2026-12-13',  6, '하카타역', null, E'킷테: 2층 칼디, 4층 세리아\n한큐백화점: 1층 게스트카드 발급, 바오바오, 4층 롱샴\n아뮤플라자: 4층 단톤, 지하 Be샌도·디저트\n아뮤에스트: 1층 3코인즈\n요도바시하카타: 3층 GU·아웃도어, 4층 로피아·다이소\n하카타 터미널: 5층 스탠다드·다이소, 7층 가차샵', 'ChIJdbP55seRQTURkIu5RT0r4i4', '하카타역', '33.589727', '130.420727'),
  ('2026-12-13',  7, '후르츠가든 신선 (과일샌드)', null, '1층 하카타 데이토스 아넥스', 'ChIJSWyUTj6RQTUR1uF8MhBavH8', '후르츠가든 신선', '33.58981', '130.420981'),
  ('2026-12-13',  8, '키와미야 함바그', null, '저녁 · 하카타버스터미널 다이소, 스탠다드', 'ChIJM6ICNACRQTUR6DD1k6EBxtQ', '키와미야 하카타역 지하가점', '33.591099', '130.419305'),
  ('2026-12-13',  9, '돈키호테 나카스점 · 편의점', null, '숙소로 돌아가는 길', 'ChIJU6_Qh5SRQTURhTacOuDrmZo', '돈키호테 나카스점', '33.593985', '130.405846'),
  ('2026-12-13', 10, '더 로얄 파크 캔버스 후쿠오카 나카스', null, '슈페리어 리버사이드 트윈룸 · 대욕장 06:00–10:00 / 15:00–25:00', 'ChIJkXqoOZORQTURyBBg18vUy4o', '더 로얄 파크 캔버스 후쿠오카 나카스', '33.594804', '130.404347'),

  -- 12/14 월 · 하카타 → 텐진
  ('2026-12-14',  1, '숙소 출발', '06:00', '더 로얄파크 캔버스 나카스점 · 예약 완료', 'ChIJkXqoOZORQTURyBBg18vUy4o', '더 로얄 파크 캔버스 후쿠오카 나카스', '33.594804', '130.404347'),
  ('2026-12-14',  2, '아임도넛 하카타', '08:00', '오픈런 · 포장', 'ChIJEVQxVACRQTUR4MfbPa_1bhw', 'I’m donut？／dacō 博多駅前', '33.589509', '130.418463'),
  ('2026-12-14',  3, '다코멧카', '09:00', '소세지 샌드위치', 'ChIJ4_Q4wR6RQTURLNTuF7CUUyo', '다코멧카', '33.58744', '130.419344'),
  ('2026-12-14',  4, '한큐백화점 & 하카타', '10:00', '오픈런 · 바오바오, 롱샴, 단톤 · 전날 못 구경한 하카타 구경', 'ChIJBVmI6seRQTUR7ISYanGmR8o', '한큐 하카타', '33.589364', '130.419838'),
  ('2026-12-14',  5, '하카타 → 텐진 지하철', null, null, null, null, null, null),
  ('2026-12-14',  6, '스기타마 또는 스시로', null, '점심 · 스기타마 텐진점 또는 텐진역 근처 스시로', 'ChIJIRPXDAiRQTUR3l_CSC8EwX8', '스기타마 텐진점', '33.592411', '130.396402'),
  ('2026-12-14',  7, '파르코백화점', null, '치이카와, 키디랜드, 리락쿠마, 단톤', 'ChIJVVUVAI-RQTUR4O0-0xXxi0Y', '파르코 텐진 후쿠오카', '33.590744', '130.398665'),
  ('2026-12-14',  8, '다이묘 거리', null, '아크테릭스, 몽벨', 'ChIJW-V_WYaRQTURJJuJlaUGDPo', '다이묘', '33.58893', '130.394311'),
  ('2026-12-14',  9, '텐진 타바네노시 찻집', null, '녹차 크레페', 'ChIJk1hfCQCRQTURu2ZWaKd_Xxk', '텐진 타바네노시 찻집', '33.585946', '130.39556'),
  ('2026-12-14', 10, '미나텐진 · 이온쇼퍼 후쿠오카', null, 'GU, 유니클로, 3코인즈 · 마트와 드럭스토어', 'ChIJtSPre46RQTURJjCpXi0cUPo', '미나 텐진', '33.59276', '130.398513'),
  ('2026-12-14', 11, '톤톤톤', null, '저녁 · 오코노미야끼와 편의점 디저트', 'ChIJE-taEUaRQTURF8mTjjfQbCc', '톤톤톤', '33.587063', '130.392175'),
  ('2026-12-14', 12, '저녁 식사 후 쇼핑', null, '못다 한 쇼핑 마무리', null, null, null, null),
  ('2026-12-14', 13, '나카스 숙소로 복귀', '23:00', '짐 싸기', null, null, null, null),

  -- 12/15 화 · 귀국
  ('2026-12-15',  1, '이치란 라멘 본점', null, '아침', 'ChIJSc8jdZORQTURu6BMwxrKbGg', '이치란 본사 총본점', '33.593241', '130.404597'),
  ('2026-12-15',  2, '후쿠오카 공항 도착', '10:30', '면세 신청 · 항공편별 출발 2시간 전 카운터 오픈', 'ChIJrQFpQhaQQTURtx9OWEZ_5hY', '후쿠오카 공항', '33.584999', '130.449091'),
  ('2026-12-15',  3, '귀국편 (석 & 썬 · 제주)', '13:00', '항공 13:00–14:30', null, null, null, null),
  ('2026-12-15',  4, '귀국편 (쏭 · 티웨이)', '14:45', '항공 14:45–15:55', null, null, null, null)
) as v(day, pos, title, t, note, pid, pname, lat, lng);

-- 소유자가 정확히 한 명일 때만 반영한다.
do $$
begin
  if (select count(*) from public.profiles where nickname = '미야♥') <> 1 then
    raise exception 'owner nickname must match exactly one profile';
  end if;
end $$;

commit;
