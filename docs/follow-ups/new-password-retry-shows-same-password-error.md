# 새 비밀번호 저장 중 표시 지우기만 실패하면 재시도 때 잘못된 안내가 뜬다

**Symptom**: 초기화된 계정이 새 비밀번호를 저장할 때, 비밀번호 변경은 성공하고 "새 비밀번호를 정해야 함" 표시를 지우는 관리자 호출만 실패하면 "비밀번호는 바꿨지만 마무리하지 못했습니다"가 뜬다. 같은 새 비밀번호로 다시 저장하면 "임시 비밀번호와 다른 비밀번호를 정해 주세요"가 떠서 재설정 화면에 갇힌 것처럼 보인다.

**Observed evidence**: 2026-11-19 `feat/admin-password-reset` 코드 리뷰(low)에서 `features/auth/new-password-actions.ts`의 흐름을 보고 찾았다. `supabase.auth.updateUser` 다음에 `createAdminClient().auth.admin.updateUserById`가 실패하는 경우다. 실제로 재현하지는 않았다.

**Suspected cause**: 두 번째 시도에서 `updateUser`가 직전에 저장된 비밀번호와 같다며 `same_password`를 돌려주고, 이 코드를 임시 비밀번호와 같다는 뜻으로만 해석한다.

**What was tried**: 수정하지 않았다. 주 경로(정상 저장)는 브라우저에서 확인했다. 다른 비밀번호를 넣으면 통과하고, 어드민이 다시 초기화해도 풀린다.

**Proposed next step**: `same_password`이고 비밀번호가 이미 바뀐 상태면 표시 지우기만 다시 시도하도록 `setNewPassword`를 고친다. 예를 들어 `same_password`일 때도 `updateUserById(app_metadata null)`와 `refreshSession`을 실행한다.
