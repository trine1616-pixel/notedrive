# PO First Session Workflow (충돌 최소화 운영 규칙)

목적: 여러 세션 병렬 작업 시 파일 충돌을 줄이고 메인 작업 안정성을 유지합니다.

## 기본 원칙
1. 기본은 **PO 세션 1개만 상시 운영**합니다.
2. 구현 세션(Frontend/Platform/Release)은 **PO가 작업 범위를 고정한 뒤**에만 엽니다.
3. 한 번에 여러 구현 세션을 열지 않습니다. (권장: 최대 1개)
4. 구현 세션 종료 후, 메인 세션에서 검증/동기화 후 다음 세션을 엽니다.

## 권장 순서
1) PO 세션 실행
- `product_owner_phase2_prompt.md`로 우선순위/DoD 확정

2) 메인 구현 세션 실행
- CTO/메인 세션에서 직접 구현 또는 Frontend 세션 1개만 열어 구현

3) 검증 세션 실행
- `release_phase2_prompt.md`로 QA 게이트/문서 동기화

## 세션 오픈 조건 (필수)
- 현재 `git status`가 예상 변경만 포함할 것
- `npm run typecheck` 통과 상태일 것
- `docs/tasks.md`, `docs/handoff.md`가 최신일 것

## 금지 사항
- 같은 파일(`dashboard.tsx`, `tasks.md`, `handoff.md`, `changelog.md`)을 2개 세션에서 동시에 수정
- PO 확정 전 기능 구현 병렬 진행

## 빠른 실행 팁
- 세션 시작 전 해당 역할 프롬프트 파일만 전달
- 세션 종료 시 결과를 메인 세션에 모아 최종 반영
