# Map provider

## Decisions

- 지도 표시와 장소 검색은 Google Maps Platform(Maps JavaScript API, Places)을 쓴다.
- 일정 항목의 장소는 구글 장소 검색 결과에서 고른 것을 저장한다. 길찾기는 구글 지도에서 그 장소를 여는 방식으로 연결한다.

## Boundaries

- 지도 위 경로 표시 방식(직선, 실제 도로 경로)과 이동 시간 계산은 각 스펙이 정한다. 이 계약은 제공자만 정한다.

## Why

첫 여행지가 일본(후쿠오카)이고 이후 여행지도 해외일 수 있다. 일본 장소 이름 검색과 길찾기가 정확해야 일정 입력과 여행 중 확인이 불편하지 않다. 기존 여행 수첩의 "지도 열기"도 지도 앱으로 연결하는 방식이라 그대로 이어진다. Google Cloud 결제 수단 등록이 필요하다는 비용 조건을 사용자가 받아들였다.

## Reconsider when

- 월 사용량이 무료 한도를 넘어 실제 청구가 생기면 다시 본다.

## Still-rejected alternatives

- 카카오맵, 네이버 지도 — 일본 지도와 장소 검색 커버리지가 약하다. 국내 여행 위주로 방향이 바뀌면 다시 본다.
- OpenStreetMap 기반(Leaflet 등) — 결제 수단은 필요 없지만 일본 장소 이름 검색이 부정확한 경우가 많다. 결제 수단 등록이 불가능해지면 다시 본다.

## Evidence worth preserving

- 2026-11-19 기준 공식 에이전트 스킬 `googlemaps/agent-skills`의 `google-maps-platform`은 `SKILL.md` 프런트매터 YAML 오류(`description` 줄)로 `skills add`가 건너뛴다. 원본이 고쳐지면 프로젝트 방식대로 설치하고 `AGENTS.md`의 스택 공식 맥락을 갱신한다.
