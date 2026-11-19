# 내가 저장해도 실시간 동기화가 여행 화면을 몇 번 더 새로 받는다

**Symptom**: 여행 화면에서 일정을 한 번 저장하면, 저장 요청(POST)이 이미 새 화면을 돌려줬는데도 그 뒤에 같은 여행 화면 GET이 2–4번 더 일어난다. 저장할 때마다 서버가 여행 화면을 여러 번 다시 그려 느려진다.

**Observed evidence**: 2026-11-19 `fix/login-speed`에서 일정 추가와 수정을 할 때 개발 서버 로그에 `POST /trips/<id>` 바로 뒤로 `GET /trips/<id>`가 0.4–0.9초씩 여러 번 찍혔다(`features/realtime/trip-realtime.tsx`의 `router.refresh()`, `REFRESH_DELAY_MS = 300`).

**Suspected cause**: 실시간 구독이 다른 멤버의 변경과 내 변경을 구분하지 않는다. 내 저장으로 생긴 행 변경 이벤트(여러 행이면 여러 번)마다 새로고침 타이머가 다시 걸린다.

**What was tried**: 수정하지 않았다. 저장 쪽의 중복 `router.refresh()`만 지웠다. 저장한 액션은 `revalidatePath`로 이미 새 화면을 받는다.

**Proposed next step**: 내가 방금 저장한 직후 짧은 시간(예: 저장 응답 뒤 1–2초)에는 실시간 새로고침을 건너뛰거나, 변경 이벤트를 한 번으로 모아(debounce를 더 길게) 처리한다. 다른 멤버의 변경은 그대로 반영되는지 두 계정으로 확인한다.
