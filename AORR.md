# Step 2 — AORR 상태 머신

## 1. Target과 완료 기준

Target은 정적 HTML·CSS·JavaScript로 구현하는 `https://jw-koo.github.io`용 반응형 개인 프로페셔널 웹사이트다. 상단 `Games` 메뉴에서 접근할 수 있는 지렁이 게임은 키보드와 모바일 터치를 지원하고, 랜덤하게 발생하는 적을 포함한다.

현재 저장소에는 `README.md`만 있으므로 구현 대상 파일은 후속 Act에서 확정한다. 프로필의 이름, 소개, 직무, 경력, 기술, 프로젝트, 연락처 및 공개 범위는 확인 전까지 `[사람 확인 필요]`로 표시한다.

완료 기준:

- 데스크톱·태블릿·모바일에서 가로 스크롤 없이 핵심 콘텐츠와 내비게이션이 동작한다.
- 시맨틱 페이지 구조, 키보드 포커스, skip link, 모바일 메뉴 접근성이 확보된다.
- `Games` 메뉴에서 게임에 접근할 수 있다.
- 키보드와 터치로 시작·이동·일시정지·재시작이 가능하다.
- 먹이, 점수, 경계/자기 몸 충돌, 랜덤 적의 생성·충돌·게임오버가 일관되게 동작한다.
- Claude Code CLI Sonnet의 전체 검증이 통과한다. Claude를 사용할 수 없으면 같은 검증을 Codex가 수행하고 결과에 `CODEX_FALLBACK`을 기록한다.
- 사람 확인이 필요한 콘텐츠와 배포 승인이 모두 해소된 뒤에만 `DEPLOY_APPROVAL_REQUIRED`에서 배포를 승인한다.

상태 전이:

`READY → ACTING → VERIFYING → PASSED`

검증 실패 시 `VERIFYING → RETRYING → ACTING → VERIFYING`으로 돌아간다. 한 Retry에서 같은 원인·관련 파일의 수정이 반복해서 해결되지 않거나 환경/권한 문제가 해소되지 않으면 `BLOCKED` 또는 `HITL_REQUIRED`로 전이한다. `PASSED` 이후 배포 전 사용자 승인이 있으면 `DEPLOY_APPROVAL_REQUIRED → DEPLOYED`로 전이한다.

## 2. Act: Codex가 수행할 최소 수정

- 현재 파일 구조와 직전 검증 결과를 읽고, 실패 원인에 직접 관련된 파일만 수정한다.
- HTML은 시맨틱 구조·내비게이션·Games 메뉴·게임 호스트와 접근성 상태 요소만 최소 작성한다.
- CSS는 디자인 토큰, 반응형 레이아웃, 포커스 표시, 터치 영역, `prefers-reduced-motion` 대응만 최소 작성한다.
- JavaScript는 페이지 상호작용과 게임 상태·입력·점수·충돌·랜덤 적 로직만 최소 작성한다.
- 콘텐츠는 확인된 자료만 넣고, 확인되지 않은 내용은 `[사람 확인 필요]`로 유지한다.
- 한 Retry에서는 원인 분류 하나만 선택하고 그 원인과 관련된 파일만 수정한다.
- Act 단계에서 테스트 실행, Git push, 배포는 하지 않는다.

## 3. Observe: Claude가 실행할 테스트와 수집할 결과

Claude Code CLI Sonnet이 Verifier 역할로 다음 전체 검증을 매번 동일하게 실행한다.

- `TEST`: 정적 파일 존재, 상대 경로 자산, HTML 파싱, 내부 링크 및 JavaScript 문법 확인
- `HTML`: 시맨틱 랜드마크, heading 순서, `Games` 메뉴, skip link, 상태 안내 확인
- `CSS`: 데스크톱·태블릿·모바일 viewport에서 레이아웃, 가로 오버플로, 가독성, 포커스 표시 확인
- `JAVASCRIPT`: 메뉴, 시작/일시정지/재시작, 키보드 입력, 상태 전이와 예외 처리 확인
- `GAME`: 먹이·점수, 경계/자기 몸 충돌, 랜덤 적 스폰·충돌·게임오버, 반복 플레이 안정성 확인
- `TOUCH`: swipe 또는 화면 방향 버튼으로 이동하고 터치만으로 게임을 시작·재시작할 수 있는지 확인
- `CONTENT`: 확인되지 않은 프로필 정보가 사실처럼 표시되지 않는지, `[사람 확인 필요]` 표기가 유지되는지 확인
- `ENVIRONMENT`: 로컬 정적 서버와 브라우저/런타임 버전, 명령 실행 결과 확인

수집할 결과:

- 사용한 Claude 모델/CLI 상태와 실행 시각
- 실행한 명령 또는 검증 절차
- viewport·입력 방식·브라우저/런타임 범위
- 각 검증 항목의 PASS/FAIL, 재현 단계, 오류 메시지
- 실패한 파일·라인·원인 분류와 다음 상태
- 전체 통과 여부

Claude CLI를 사용할 수 없을 때만 Codex가 동일한 검증을 수행하며, 결과에 `CODEX_FALLBACK`을 명시한다.

## Self-Correcting TDD Loop

기본 모드는 `Codex = Worker`, `Claude Code CLI Sonnet = Verifier`다. 실제 확인된 Verifier 모델은 `claude-sonnet-5`이며, CLI의 `sonnet` 별칭으로 실행한다. Codex는 Claude가 실행한 테스트를 중복 실행하지 않는다.

실행 순서:

1. `READY → ACTING → VERIFYING`으로 전이하고, Claude가 변경 전 전체 테스트를 실행한다.
2. Claude는 실패 항목, 핵심 오류, 관련 파일·라인, 실행 주체와 모델, 명령, exit code, fingerprint, 최종 상태를 보고한다.
3. Codex는 보고된 실패를 원인 하나로 분류하고, 해당 원인에 필요한 최소 코드만 관련 파일에 수정한다.
4. Claude가 변경 전과 동일한 전체 테스트를 재실행한다. 테스트를 삭제하거나 완화하지 않는다.
5. 실패하면 Claude가 새 결과와 fingerprint를 보고하고, Codex가 다음 최소 수정 후 다시 Claude 검증으로 넘긴다.
6. Claude의 전체 검증이 통과할 때만 `PASSED`로 전이한다.

검증 범위:

- 파일 존재와 상대 경로
- HTML 구조와 내부 링크
- CSS 반응형 레이아웃
- JavaScript 오류
- 지렁이 게임 기능과 키보드·터치 입력
- 로컬 HTTP 응답
- 375px, 768px, 1440px viewport
- GitHub Pages 호환성

실패 기록 필드:

`실행 주체 | 모델 | 명령 | exit code | 핵심 오류 | 관련 파일·라인 | fingerprint | 최종 상태`

Retry 규칙:

- 오류당 최대 6회까지만 재시도한다.
- 동일 fingerprint가 6회 반복되면 더 수정하지 않고 `BLOCKED` 또는 `HITL_REQUIRED`로 중지한다.
- 한 Retry에서는 원인 하나와 관련된 최소 파일만 수정한다.
- 테스트 삭제·완화·검증 범위 축소는 금지한다.

Claude CLI를 사용할 수 없을 때만 `CODEX_FALLBACK`으로 전환해 Codex가 수정과 테스트를 모두 수행한다. 전환 시점, Fallback 이유, 실행한 동일 테스트, 결과와 모델을 기록한다. 현재 확인 결과는 Claude 사용 가능 상태이므로 Fallback은 사용하지 않는다.

## 4. Reason: 실패 원인 분류

각 실패는 아래 분류 중 정확히 하나로 기록한다.

| 분류 | 판단 기준 |
|---|---|
| HTML | 문서 구조, 요소, 속성, 링크, 접근성 마크업 오류 |
| CSS | 레이아웃, 반응형, 스타일, 대비, 포커스, 오버플로 오류 |
| JAVASCRIPT | 메뉴·상태·이벤트·문법·런타임 오류(게임 전용 오류 제외) |
| GAME | 이동, 먹이, 점수, 충돌, 적, 게임오버, 난이도 또는 게임 루프 오류 |
| CONTENT | 확인되지 않은 프로필 정보, 오탈자, 공개 범위 또는 `[사람 확인 필요]` 누락 |
| TEST | 검증 절차, assertion, fixture 또는 테스트 정의 오류 |
| ENVIRONMENT | 로컬 서버, 브라우저, 런타임, 의존 실행 환경 문제 |
| GITHUB | 원격 저장소, 인증, 브랜치, Pages 저장소 설정 문제 |
| DEPLOYMENT | 배포 후 자산 경로, 캐시, Pages 반영 또는 실서비스 동작 문제 |
| UNKNOWN | 증거가 부족해 단일 원인을 확정할 수 없는 경우. 즉시 HITL_REQUIRED로 올림 |

## 5. Repeat: Codex 최소 수정 → Claude 동일 테스트 재실행

1. `VERIFYING`에서 FAIL 결과를 기록한다.
2. Codex가 실패를 하나의 원인 분류와 관련 파일로 좁힌다.
3. Codex는 해당 파일만 최소 수정하고, 수정 범위와 예상 효과를 기록한다.
4. 상태를 `RETRYING`으로 기록한 뒤 `ACTING`으로 전이한다.
5. Claude Code CLI Sonnet이 변경되지 않은 동일 테스트 세트와 동일한 기준으로 재실행한다.
6. 전체 검증이 통과하면 `PASSED`; 하나라도 실패하면 새 증거를 기준으로 다시 분류한다.
7. 원인이 둘 이상이면 먼저 가장 직접적인 단일 원인만 수정하고, 다음 Retry에서 나머지를 처리한다. 한 Retry에서 여러 분류나 무관한 파일을 함께 수정하지 않는다.

## 6. Stop과 HITL 조건

`STOP` 조건:

- Claude의 전체 검증이 통과하면 `PASSED`에서 구현 루프를 멈춘다.
- `PASSED` 후에는 push·배포하지 않고 `DEPLOY_APPROVAL_REQUIRED`에서 사용자 승인을 기다린다.
- `DEPLOYED`에 도달하면 배포 검증까지 완료한 것으로 멈춘다.

`HITL_REQUIRED` 조건:

- 공개할 프로필 내용·연락처·외부 링크 범위가 불명확하다.
- 적의 종류, 등장 주기, 충돌 결과, 난이도 상한 또는 모바일 조작 방식이 불명확하다.
- `UNKNOWN`으로 분류되어 증거만으로 원인을 좁힐 수 없다.
- Claude CLI 사용 여부, 브라우저/런타임 환경 또는 테스트 범위가 검증 결과에 영향을 준다.
- 배포·push 승인이 명시되지 않았다.
- 개인정보 또는 보안상 민감한 정보가 발견되거나 저장될 위험이 있다.

`BLOCKED` 조건:

- 필요한 파일·도구·권한·실행 환경이 없어 안전한 대체 검증도 불가능하다.
- 같은 원인에 대한 Retry가 반복됐지만 외부 상태 변경 없이는 해결할 수 없다.
- 원격 GitHub 또는 Pages 상태가 확인되지 않고 사용자 조치가 필요하다.

## 7. 개발 루프 표

| 루프 | 입력 | Codex Act | Claude Verify | 통과 기준 | 다음 상태 |
|---|---|---|---|---|---|
| 1. 범위·콘텐츠 확정 | `MEMORY.md`, `STEP1_ANALYSIS.md`, 사용자 승인 콘텐츠 | 구현 범위와 `[사람 확인 필요]` 목록을 확정하고 필요한 최소 파일 계획 작성 | 요구사항·공개 범위·게임 규칙 확인 | 불명확한 콘텐츠와 게임 규칙이 해소됨 | `ACTING` 또는 `HITL_REQUIRED` |
| 2. 페이지 골격 | 확정 정보구조와 콘텐츠 | HTML·내부 링크·Games 진입점 최소 구현 | HTML/TEST/CONTENT 전체 확인 | 구조·링크·접근성 기본 검증 PASS | `VERIFYING` |
| 3. 반응형 스타일 | HTML 골격, 디자인 방향 | CSS 토큰·레이아웃·breakpoint·포커스 최소 구현 | CSS/HTML을 desktop·tablet·mobile에서 확인 | 오버플로 없음, 탐색·가독성·포커스 PASS | `VERIFYING` |
| 4. 게임 코어 | Games 화면과 승인된 규칙 | JavaScript로 이동·먹이·점수·충돌·상태·키보드 최소 구현 | JAVASCRIPT/GAME/TEST 확인 | 핵심 게임 흐름과 키보드 조작 PASS | `VERIFYING` |
| 5. 적·터치 확장 | 게임 코어, 승인된 적 규칙 | 랜덤 적과 모바일 터치 입력만 최소 추가 | GAME/TOUCH/JAVASCRIPT/TEST 반복 확인 | 적·터치·재시작이 공정하고 안정적 | `VERIFYING` |
| 6. 실패 Retry | Claude의 단일 실패 결과 | 원인 하나와 관련 파일만 최소 수정 | 동일 전체 테스트 재실행 | 전체 검증 PASS 또는 새 단일 원인 도출 | `PASSED`, `RETRYING`, `HITL_REQUIRED` 또는 `BLOCKED` |
| 7. 최종 검증 | 모든 구현 파일 | 코드 변경 없이 결과 정리 | Claude 전체 검증과 콘텐츠·보안 확인 | 모든 항목 PASS | `PASSED` |
| 8. 배포 승인 대기 | `PASSED` 결과 | push·배포를 수행하지 않고 승인 요청 | 배포 전 체크리스트 확인 | 사용자의 명시적 push·배포 승인 | `DEPLOY_APPROVAL_REQUIRED` |
| 9. 배포 | 승인된 검증 결과와 원격 설정 | 승인 범위 내 push/Pages 배포 수행 | 실 URL·자산·반응형·Games·게임 재검증 | `https://jw-koo.github.io`에서 정상 동작 | `DEPLOYED` 또는 `BLOCKED` |

## Step 8 실행 순서

`CR-001 공식 링크 교체 → CR-002 디자인 개선 → CR-003 아이템 획득 이펙트 → CR-004 피버 모드 → Claude 전체 회귀 검증` 순서로 진행한다. 각 Change Item은 변경 전 Claude 검증, Codex 최소 Act, 동일 Claude 검증을 수행하며, 실패 시 원인 하나·관련 파일만 최대 6회 Retry한다. 모든 검증 통과 전에는 commit·push·배포하지 않고, 미정 피버 규칙은 `HITL_REQUIRED`로 멈춘다.
