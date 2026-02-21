# NoteDrive 문서 지도

이 문서는 NoteDrive 프로젝트의 문서/코드 위치와 읽는 순서를 빠르게 안내하는 인덱스입니다.

## 먼저 읽기 (권장 순서)
1. `docs/tasks.md` - 현재 진행 중/예정 작업
2. `docs/handoff.md` - 최근 인수인계 상태
3. `docs/decisions.md` - 주요 기술 의사결정(ADR)
4. `README.md` - 루트 실행/구조 요약
5. `notedrive/README.md` - 앱 실행/환경변수 상세

## 디렉토리별 역할

### `docs/` - 운영 및 기술 문서
- `docs/project_context.md`: 프로젝트 목표/가치/범위
- `docs/architecture.md`: 시스템 구조와 설계 원칙
- `docs/tasks.md`: 현재 작업과 향후 로드맵
- `docs/decisions.md`: 의사결정 기록(ADR)
- `docs/handoff.md`: 세션 간 상태 공유
- `docs/changelog.md`: 날짜별 변경 이력
- `docs/device_runbook_phase2.md`: 실기기 점검 런북
- `docs/qa_log.md`: 테스트 실행 결과 기록
- `docs/archive/`: 과거 문서/레거시 기록 보관

### `notedrive/` - 앱 소스 코드
- Next.js 기반 NoteDrive 애플리케이션 본체
- 주요 UI/에디터/스토리지 로직 포함

### `scripts/` - 실행 및 자동화 스크립트
- `scripts/launch_notedrive_windows.bat`: Windows 실행
- `scripts/launch_notedrive_windows.ps1`: Windows 실행(PS)
- `scripts/stop_notedrive_windows.ps1`: Windows 중지
- `scripts/runtime_backup/`: macOS 보조 런처/백업 스크립트

### 루트 실행 스크립트
- `run_notedrive.sh`: macOS 공식 실행 진입점
- `launch_notedrive_mac.sh`: macOS 안정 실행 런처
- `start_notedrive_daemon.mjs`: 빌드/실행 데몬 엔트리
- `stop_notedrive_mac.sh`: macOS 실행 중지

### `Obsidian_Vault/` - 실제 Markdown 저장소
- 사용자 노트 데이터(폴더/노트/첨부파일) 저장 위치
- 로컬 모드에서 기본적으로 이 경로를 참조

### `prompts/` - 에이전트 프롬프트 템플릿
- 세션 시작/종료 및 기능별 프롬프트 모음

### `skills/` - 에이전트 규칙/전문 지식
- 분류/정책/자동화 관련 스킬 문서

## 빠른 목적별 진입
- 실행이 안 될 때: `README.md` -> `notedrive/README.md` -> `docs/device_runbook_phase2.md`
- 무엇을 먼저 개발할지: `docs/tasks.md`
- 왜 그렇게 구현됐는지: `docs/decisions.md`
- 이전 작업 맥락 복원: `docs/handoff.md`

---
작업 시작 시 `docs/tasks.md`와 `docs/handoff.md`를 먼저 확인하면 맥락 복원이 가장 빠릅니다.
