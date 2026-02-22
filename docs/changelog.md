## [2026-02-23] - 에디터 몰입 환경 조성 및 모바일 UX 미세 조정
- **몰입형 에디터 UI**: 에디터 포커스 시에만 툴바가 노출되도록 개선하고, 읽기 모드 영역을 극대화함.
- **모바일 하단 내비게이션 개편**: '노트북 | 검색 | 더 보기' 구조로 전면 재배치하고 메뉴 항목을 한글화함.
- **워크플로우 최적화**: 노트 저장 시 나타나던 불필요한 '저장 완료' 토스트 알림을 제거함.
- **레이아웃 안정성 강화**: 모바일 뷰에서 너비 초과로 인해 아이콘이 잘리는 현상을 수정하고 반응형 대응력 높임.
- **차기 작업 예약**: 데스크탑 사이드바 복구 토글, 모바일 진입 애니메이션 간소화, 검색 기능 고도화 등 Phase 2 계획 수립.

## [2026-02-22] - Always-on 아키텍처 및 동기화 안정성 강화
- **Always-on 인프라**: Cloud Run 배포를 위한 `Dockerfile` 및 `scripts/deploy_cloudrun.sh` 구축 완료.
- **Next.js 최적화**: `standalone` 빌드 모드 적용으로 배포 이미지 경량화.
- **동기화 안정성**: Google Drive API 호출에 지수 백오프(Exponential Backoff) 재시도 로직 도입 (401/429 에러 대응).
- **운영 문서 최신화**: Cloud Run 설정 가이드 및 시크릿 관리 방안을 `docs/operations.md`에 통합.

## [2026-02-21] - 세션 마감 정리 (Codex 검수 모드 전환)
- `docs/tasks.md`에서 문서 일원화/실행 경로 단일화 완료 상태를 반영했습니다.
- `docs/decisions.md`에 ADR-011(개발/검수 도구 역할 분리) 결정을 추가했습니다.
- `docs/handoff.md`에 `Next Immediate Action`을 명시해 다음 세션 시작점을 고정했습니다.
- 최신 handoff 스냅샷을 `docs/archive/handoff_260221.md`로 갱신했습니다.

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
