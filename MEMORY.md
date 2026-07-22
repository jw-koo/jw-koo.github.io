# MEMORY
## Project Settings
- GitHub Pages 주소: https://jw-koo.github.io
- GitHub 저장소: git@github.com:jw-koo/jw-koo.github.io.git
- 프로필 참고 자료: https://www.linkedin.com/in/%EC%9E%90%EC%9B%90-%EA%B5%AC-8b3091127/
- 웹사이트 디자인 참고: 모던하고 세련된 느낌
- 게임 추가 기능: 귀여운 바이러스 적이 랜덤 발생하는 지렁이 게임
- GitHub SSH 인증: 이 기기에 설정됨
- 기술 제약: 정적 HTML, CSS, JavaScript만 사용
- 프로필: 구자원; SW Engineer of Samsung Electronics - Mobile Experience Business Division
- 관심 분야/기술 표기: Android, iOS, Flutter, 모바일 앱 개발
- 경력: Samsung Electronics Software Engineer(2018.06–2026.02), Staff Engineer(2026.03–현재), Republic of Korea Air Force Sergeant(2013.08–2015.08)
- 팀·업무: Framework R&D Intelligent Platform—Modes and Routines Android; AI Team—신규 프로젝트; IoT Service—IoT·SmartThings iOS
- 공개 프로젝트: Mode and Routines (Android App) 1개
- 공개 링크: LinkedIn 프로필 URL만 사용
- 프로필 사진: 사용하지 않음; 사이트 언어: 한국어
- 게임 입력: 키보드·WASD·모바일 방향 버튼·스와이프
- 게임 규칙: 음식·성장·점수·체력 감소·게임오버·난이도 상승
## Goal
- 정적 반응형 프로페셔널 웹사이트와 Games 지렁이 게임을 완성해 GitHub Pages에 배포한다.
## Scope / Out of Scope
- Scope: Home, About, Experience, Projects, Contact, Games, 반응형 UI, 게임, GitHub Pages 호환성.
- Out of Scope: 백엔드·외부 서비스·프레임워크, 확인되지 않은 개인정보, 승인 전 commit·push·배포.
## Execution
- Mode: CODEX_WORKER + CLAUDE_VERIFIER; Claude 불가 시에만 CODEX_FALLBACK.
- Claude model: `claude-sonnet-5` (`sonnet` 별칭).
- Last test: PASS — Claude 정적/게임/Node/로컬 HTTP 검증 완료.
## Current State
- 상태: DEPLOYED — GitHub Pages 배포본 회귀 검증 PASS.
- 완료 루프: Step 1~5 계획·스캐폴드, Step 7 Loop 1 페이지, Loop 2 게임 및 GAME Retry 1회.
- 다음 루프: 필요 시 콘텐츠·기능 개선 후 동일 Verifier 회귀 검증.
- Retry: GAME 1/6; 동일 fingerprint 반복 없음.
- fingerprint: index.html 4854B, styles.css 4225B, script.js 9974B; untracked.
- blocker: 없음.
- 마지막 정상 commit·URL: `bccee06` (`Create static.yml`); https://jw-koo.github.io.
## Acceptance
- 375px·768px·1440px, HTML/CSS/JS/게임/터치/HTTP/내부 링크/상대 경로/GitHub Pages 검증 전체 PASS 후 배포 승인 요청.
## Guardrails
- 확인되지 않은 개인 정보 생성·기존 콘텐츠 임의 삭제·테스트 삭제/완화를 금지한다.
- 대규모 재작성·백엔드·외부 서비스·프레임워크 임의 추가를 금지한다.
- 토큰을 출력·로그·코드·문서·Git에 저장하지 않는다.
- 상세 실행 기록은 AORR_LOG.md에 저장한다.
## Retry / HITL
- 오류당 최대 6회, Retry마다 원인 하나와 관련 최소 파일만 수정하며 동일 fingerprint 6회면 중지한다.
- 환경·콘텐츠·게임 규칙·민감 정보·push/배포 승인은 HITL_REQUIRED다.
- Claude 불가 시 이유·모델·동일 테스트·결과를 CODEX_FALLBACK으로 기록한다.
## Recent Loops
| Loop | 상태 | 실행 모드·모델 | 변경 파일 | 테스트 결과 | Retry | 다음 작업 |
|---|---|---|---|---|---|---|
| Step 5 | 완료 | CODEX_WORKER + CLAUDE_VERIFIER · claude-sonnet-5 | index.html, styles.css, script.js | 정적 PASS; Node·HTTP N/A | 0 | 구현 진행 |
| Step 7 Loop 1 | 완료 | CODEX_WORKER + CLAUDE_VERIFIER · claude-sonnet-5 | index.html | Contact 포함 정적 PASS; Node N/A | 0 | 게임 구현 |
| Step 7 Loop 2 | DEPLOYED | CODEX_WORKER + CLAUDE_VERIFIER · claude-sonnet-5 | index.html, styles.css, script.js, .github/workflows/static.yml | 로컬·배포본/Node/HTTP PASS | 1 | 유지보수·추가 개선 |
