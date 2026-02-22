# Notion 스타일 블록/단축 입력 구현 계획 (Phase 1)

최종 업데이트: 2026-02-22
목표: NoteDrive 에디터에서 `/` 블록 명령 + 마크다운 단축 입력 자동화를 MVP 수준으로 제공

## 1) 범위 (MVP)
- Slash Command 메뉴(`/` 입력 시)
  - 텍스트
  - 제목 1/2/3
  - 글머리 목록
  - 번호 목록
  - 체크리스트
  - 인용문
  - 구분선
  - 코드 블록
  - 오늘 날짜 삽입
- 인라인/단축 입력 자동 변환
  - `# `, `## `, `### ` -> Heading
  - `- `, `* ` -> Bullet list
  - `1. ` -> Ordered list
  - `[] ` 또는 `[ ] ` -> Task list item
  - `---` -> Divider
  - ```` ``` ```` -> Code block
  - `/date` 또는 `/today` -> 오늘 날짜 문자열 치환
- 텍스트 스타일
  - 글자 크기: Small/Default/Large (문단 클래스 기반)
  - 글자 색상: 기본 팔레트 6~8개

## 2) 비범위 (이번 단계 제외)
- Notion 전체 블록 1:1 복제(토글 블록, 데이터베이스, 멀티컬럼)
- 협업 커서/코멘트
- 블록 드래그 핸들 재정렬

## 3) 기술 접근 (Tiptap 기준)
- 대상 파일
  - `notedrive/src/components/rich-editor.tsx`
  - 필요 시 `notedrive/src/components/extensions/*` 신규 추가
- 도입 후보 확장
  - `@tiptap/extension-text-style`
  - `@tiptap/extension-color`
  - `@tiptap/suggestion` (Slash 메뉴)
- 구조
  - Slash 메뉴 로직을 `extensions/slash-command.ts`로 분리
  - 명령 목록 정의를 `lib/editor-commands.ts`로 분리
  - 모바일/데스크탑 공통으로 동작, UI만 조건 분기

## 4) 단계별 실행
1. Phase 1-A: Slash Command MVP
- `/` 입력 시 메뉴 노출, 키보드 Up/Down/Enter 선택
- 상위 10개 명령만 제공
- 명령 실행 후 트리거 텍스트(`/...`) 제거

2. Phase 1-B: 단축 입력 자동 변환
- 공백/엔터 시점 패턴 감지 후 노드 변환
- 기존 Markdown 입력 흐름과 충돌 없는지 우선 검증

3. Phase 1-C: 글자 크기/색상 UI
- 데스크탑 툴바 + 모바일 하단 툴바에 최소 UI 추가
- 선택 범위 없으면 커서 위치 기준 적용

4. Phase 1-D: 안정화
- 자동저장과 충돌(불필요 re-render, selection jump) 점검
- 한글 IME 조합 중 오작동 방지

## 5) 완료 기준 (DoD)
- `/` 입력으로 명령 메뉴가 200ms 이내 표시
- 위 MVP 명령이 모두 실제 문서 구조에 반영
- 마크다운 단축 입력 8종이 자동 변환
- 모바일/데스크탑에서 동일 기능 동작
- `npm run typecheck` 통과
- 수동 QA 체크리스트 통과(단축 입력, Slash, 자동저장 동시 시나리오)

## 6) 리스크와 대응
- 리스크: Tiptap Markdown extension과 자동 변환 규칙 충돌
  - 대응: 입력 훅 우선순위 고정, 충돌 규칙은 Slash 명령 우선
- 리스크: IME(한글) 입력 중 오탐지
  - 대응: composition 이벤트 구간에서는 변환 로직 비활성화
- 리스크: 모바일 툴바 복잡도 증가
  - 대응: 색상/크기 UI는 Bottom Sheet로 축약

## 7) 다음 세션 시작 절차
1. `docs/tasks.md`와 본 문서를 먼저 확인
2. `rich-editor.tsx`에서 기존 툴바/입력 처리 구조 파악
3. Slash 명령만 먼저 구현 후 typecheck
4. 단축 입력/스타일을 순차 확장

## 8) 다음 세션 보고 형식
1. 구현된 Slash 명령 목록
2. 구현된 단축 입력 목록
3. 변경 파일 절대경로
4. 테스트 결과(typecheck + 수동 QA)
