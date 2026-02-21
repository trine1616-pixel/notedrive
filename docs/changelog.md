## [2026-02-21] - 문서 동기화 및 운영 가이드 정리
- `README.md`를 현재 코드 기준으로 재작성하고 절대경로 링크를 제거했습니다.
- `notedrive/README.md`를 한글 중심으로 보강하고 실행/설정/운영 섹션을 분리했습니다.
- `docs/docs_map.md`를 실무형 인덱스로 재정리하고 문서 읽는 순서를 명확히 했습니다.
- `docs/tasks.md`를 상태(`완료/진행/다음/보류`)와 우선순위(`P1/P2`) 기반으로 개편했습니다.
- `docs/handoff.md`를 최신 태스크 구조와 동기화하고 참고 링크를 상대경로로 통일했습니다.
- macOS 실행 경로를 `run_notedrive.sh` 단일 진입점 기준으로 정리했습니다.
- QA 결과 기록용 `docs/qa_log.md`를 추가했습니다.

## [2026-02-21] - 모바일 UI 개선 및 프로젝트 구조 최적화
- **NoteDrive 생태계 통일**: 로컬 LLM 엔진과 NoteDrive 앱 개발 방향을 하나의 비전으로 통합 및 관련 문서(`project_context.md`, `architecture.md`) 최신화.
- **문서 구조 최적화**: `prompts/`, `skills/` 디렉토리를 체계적으로 재구성하고 전체 문서 지도를 관리하는 `docs/docs_map.md` 신설.
- **레거시 파일 정리**: 불필요한 로그 파일 삭제 및 구버전 코드/데이터를 `docs/archive/legacy/`로 이동. 실행 스크립트를 `run_notedrive.sh` 중심으로 단일화.
- **모바일 UX 고도화**: 하단 내비게이션 바(Search, More Actions) 및 FAB(새 노트 작성) 버튼 추가. Radix UI 접근성(Accessibility) 경고 해결.

## [2026-02-16] - 초기화
- 프로젝트 디렉토리 구조 생성 (`docs`, `prompts`, `scripts`, `src`).
- 핵심 가이드 문서 (`project_context`, `architecture`, `tasks`, `decisions`, `handoff`) 초기화.
- 사용자의 `handoff_코딩_디폴트셋업.md`를 기반으로 시스템 복구 시작.
