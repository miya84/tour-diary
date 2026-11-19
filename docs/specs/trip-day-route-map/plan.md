# 구현 계획: 여행 만들기와 하루 동선 지도

기준 스펙: [spec.md](spec.md). 진행 방식은 `implement` 스킬을 따른다. 이 문서는 작업 순서를 안내할 뿐이고, 동작과 수용 기준은 `spec.md`가 정한다. 둘이 다르면 `spec.md`를 따른다.

## 시작 전 결정

- [ ] 기존 미커밋 파일 4개(`app/globals.css`, `components.json`, `components/ui/button.tsx`, `lib/utils.ts`)를 어떻게 할지 정한다. 내용은 shadcn 테마 프리셋 변경이고, `globals.css`의 `:root`에서 `--background`와 `--foreground` 정의가 빠져 있다.

## 준비 상태

| 항목 | 상태 |
|---|---|
| Supabase Cloud 프로젝트 `tour-diary` (Tokyo) | 완료 |
| Supabase CLI 로그인 | 완료 |
| Supabase Email 제공자 켜짐, Confirm email 설정 | 확인 필요 |
| Google Cloud 결제 계정, Maps JavaScript API·Places API (New) 활성화 | 완료 (Places Text Search 응답 확인) |
| 구글 지도 API 키, 지도 ID | 발급 완료 (지도 ID는 확인 필요) |

## 단계

| 단계 | 하는 일 | 사용자 할 일 |
|---|---|---|
| 0. 준비 | 브랜치 확인, `bun install`, 설치된 Next.js 16 문서와 `AGENTS.md`의 스택 공식 맥락(Supabase, 구글 지도) 읽기 | 위 "시작 전 결정" |
| 1. Supabase 연결 | `setup-supabase` 스킬로 `tour-diary` 프로젝트 연결. 이메일+비밀번호 가입·로그인·로그아웃, 로그인 상태가 반영되는 헤더 | `.env.local`에 Supabase URL과 Publishable key 입력 |
| 2. DB | 여행과 일정 항목 테이블, 마이그레이션. 본인 데이터만 읽고 쓰는 권한 규칙(RLS). 첫 마이그레이션은 적용 완료. 순서 변경을 위해 순서 컬럼을 추가하는 마이그레이션이 하나 더 필요 | `supabase db push`가 멈추면 터미널에서 직접 실행, 적용 전 SQL 확인 |
| 3. 여행 목록·생성 | 내 여행 목록, 제목·시작일·종료일로 새 여행 만들기, 종료일 검증 | – |
| 4. 날짜별 일정 | 여행 기간 날짜 선택, 일정 항목 추가·수정·삭제, 같은 날 안에서 끌어서 순서 변경. 장소·시작 시간·메모는 선택 | – |
| 5. 장소 검색과 지도 | 구글 장소 자동완성, 위쪽 지도에 번호 핀과 직선 연결, 핀이 없을 때 빈 상태, "지도 열기" 링크 | `.env.local`에 구글 지도 API 키와 지도 ID 입력 |
| 6. 테스트 | 순수 로직(여행 날짜 목록, 핀 번호 매기기 등)을 테스트 먼저 작성(TDD) | – |
| 7. 실제 브라우저 검증 | AC1~AC14 확인. 폰 너비 화면 포함, 두 계정으로 접근 차단 확인 | – |
| 8. 리뷰 | `code-review low` 1회. 수용 기준을 깨는 지적만 고치고 나머지는 `docs/follow-ups/`에 기록 | – |
| 9. PR | PR 생성과 CI 확인 | GitHub API 인증서 오류로 막히면 터미널에서 PR 생성 |
| 10. 확인 | 로컬 서버를 띄워 주소 공유 | 직접 사용해 보고 병합 결정 |

## 알아 둘 점

- `setup-supabase` 스킬은 기본으로 `profiles` 테이블과 `/settings`(표시 이름 수정) 페이지도 만든다. 스펙에 없지만 금지되지 않아 스킬 기본 동작대로 둔다.
- 작업은 `docs/trip-day-route-map` 브랜치에서 이어 한다. PR 하나에 스펙 문서와 구현이 함께 들어간다.
- 모든 커밋 메시지 끝에 `Spec-Folder: docs/specs/trip-day-route-map/`을 붙인다.
- `.env.local`의 값은 사용자가 직접 입력한다. 이 파일은 git에 들어가지 않는다.
- 이 세션에서는 GitHub API 인증서 오류가 있어 PR 생성과 CI 확인이 막힐 수 있다.
