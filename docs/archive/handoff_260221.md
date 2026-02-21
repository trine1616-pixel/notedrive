# NoteDrive Project Handoff

최종 업데이트: 2026-02-21

## 0) 새 세션 시작 전 필수 읽기
- `docs/project_context.md`: 프로젝트 목표/범위/성공 기준
- `docs/tasks.md`: 현재 우선순위와 진행 상태
- `docs/decisions.md`: 구현/운영에 영향을 주는 ADR 결정 사항

## 1) 현재 상태 요약
- 앱 핵심 기능은 1차 완성 상태입니다.
- 3-pane UX, 폴더/노트 CRUD, 드래그 이동, 휴지통 복원/영구삭제, 태그 자동완성까지 구현되어 있습니다.
- 실행 문서와 문서 구조(`README`, `notedrive/README`, `docs/docs_map`)는 최신 기준으로 정리되었습니다.

## 2) 이번 사이클 기준 완료 항목
- 3-pane 레이아웃 이슈 수정(스크롤/겹침/토글 중복 제거)
- 폴더 다중 선택, 다중 이동, 다중 색상 변경
- 휴지통 데이터 계층(노트/폴더 soft delete + restore/permanent delete)
- 해시태그 실시간 반영 + 자동완성 + 하이라이트
- macOS 실행 안정화(`clean build -> start`), Windows 실행 스크립트 추가

## 3) 현재 우선순위 (tasks 동기화)
- `P1` 모바일 UX 고도화
  - 목표: 갤럭시 실사용 기준으로 폴더 -> 목록 -> 에디터 흐름 최적화
- `P1` 운영 문서 일원화
  - 목표: 실행/설정/검증 절차를 문서만으로 재현 가능하게 정리
- `P1` Always-on 아키텍처 설계
  - 목표: Cloud Run + OAuth/Drive API + 비용 가드레일 문서화

세부 항목은 `docs/tasks.md`를 기준으로 관리합니다.

## 4) 실행 기준
- macOS: `./run_notedrive.sh` (공식 실행 진입점)
- Windows: `.\scripts\launch_notedrive_windows.bat`
- 접속: `http://localhost:9002`

안정 실행/스토리지 모드 설정은 `notedrive/README.md` 참고.

## 5) 알려진 제한사항
- 모바일 전용 UX는 고도화가 아직 필요합니다.
- APK 패키징은 별도 단계(Capacitor 등)가 필요합니다.
- Always-on 운영은 클라우드 아키텍처 설계/검증이 필요합니다.

## 6) 관련 문서
- 문서 지도: `docs/docs_map.md`
- 작업 우선순위: `docs/tasks.md`
- 의사결정(ADR): `docs/decisions.md`
- 변경 이력: `docs/changelog.md`

## 7) Next Immediate Action
- Antigravity에서 모바일 UX 고도화(P1)를 이어서 진행한다.
- 시작 순서:
  1. 모바일에서 `폴더 -> 노트목록 -> 에디터` 전환 플로우 고정
  2. 새 노트 생성 시 포커스/가상 키보드 자동 활성화 개선
  3. 실기기 점검 후 결과를 `docs/qa_log.md`에 기록
