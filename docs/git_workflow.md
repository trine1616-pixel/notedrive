# Git 협업 워크플로우

목표: 여러 역할이 병렬 개발해도 충돌과 회귀를 최소화한다.

## 브랜치 규칙
- 기본 브랜치: `main`
- 역할별 작업 브랜치 예시:
  - `feature/drive-auth-<date>`
  - `feature/cloud-finops-<date>`
  - `feature/frontend-ux-<date>`
  - `feature/ai-pipeline-<date>`
  - `fix/ux-issue-<date>`

## PR 규칙 (필수)
- PR 본문에 다음 4개를 반드시 포함:
  1. 변경 요약
  2. 테스트 결과
  3. 영향 범위
  4. 롤백 방법

## 머지 규칙
- 머지 담당: `ReleaseOrchestrator`
- 머지 전 체크:
  - 충돌 없음
  - 핵심 시나리오 회귀 테스트 PASS
  - 문서(`tasks`, `handoff`, `changelog`) 동기화 완료

## 충돌 방지 규칙
- 동일 파일 동시 수정 금지
- 큰 기능은 먼저 인터페이스/계약 문서(ADR 또는 계획 문서) 확정 후 구현
- 머지 순서 우선:
  1. 공통 기반 변경
  2. 기능 변경
  3. UI 폴리싱

## Codex / Antigravity 역할 분리
- 본개발: Antigravity
- 검수/통합/문서 동기화: Codex

## 현재 자동화 상태
- 브랜치 생성/PR/머지는 수동 운영
- 향후 자동화 후보:
  - GitHub Actions CI (typecheck/build/test)
  - PR 템플릿 강제
  - 라벨 기반 머지 게이팅
