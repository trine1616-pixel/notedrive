# FrontendUXEngineer Prompt - Editor Block Automation Phase 1

목표: NoteDrive 에디터에 Notion 스타일 생산성 기능을 MVP로 구현한다.

## 시작 전 필수 문서
1. `docs/tasks.md`
2. `docs/editor_block_automation_plan.md`
3. `docs/handoff.md`

## 이번 세션 구현 범위
1. Slash Command(`/`) 메뉴 MVP
- 텍스트, H1/H2/H3, Bullet, Numbered, Task, Quote, Divider, Code Block, Today Date

2. 단축 입력 자동 변환
- `# `, `## `, `### `
- `- `, `* `
- `1. `
- `[] ` 또는 `[ ] `
- `---`
- ```` ``` ````
- `/date`, `/today`

3. 스타일 최소 기능
- 글자 크기 3단계(Small/Default/Large)
- 글자 색상 팔레트(6~8개)

## 대상 코드 (우선순위)
- `notedrive/src/components/rich-editor.tsx`
- 필요 시 `notedrive/src/components/extensions/*`

## 제약
- 기존 자동저장/모바일 편집 흐름을 깨지 말 것
- 한글 IME 입력 중 오작동 방지
- 기능 구현 후 `npm run typecheck` 필수

## 결과 보고 형식
1. 구현된 명령/단축 입력 목록
2. 수정 파일(절대경로)
3. 테스트 결과(typecheck + 수동 QA 핵심 시나리오)
4. 남은 이슈/다음 액션
