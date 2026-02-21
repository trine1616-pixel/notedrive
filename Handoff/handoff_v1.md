# NoteDrive Handoff v1 (요약본)

## 현재 상태
- 1차 완성 수준 도달
- Mac 실행 안정화 완료 (`NoteDrive.app`, `launch_notedrive_mac.sh`)
- Windows 실행 스크립트 준비 완료
- 핵심 기능(3-pane, 드래그 이동, 휴지통 복원, 해시태그 자동완성) 구현 완료

## 핵심 완성 기능
1. 3-pane 노트 UI 안정화
2. 폴더/노트 CRUD + 우클릭 메뉴
3. 폴더/노트 드래그 이동
4. 폴더 다중 선택 및 다중 색상 변경
5. 휴지통(복원/영구삭제)
6. 이미지/파일 첨부
7. 해시태그 실시간 반영 + 자동완성 + 하이라이트
8. 테마(다크/라이트/시스템)

## 실행
- Mac:
  - `NoteDrive.app` 더블클릭
  - 또는 `./launch_notedrive_mac.sh`
- Windows:
  - `launch_notedrive_windows.bat`
- 공통 접속:
  - `http://localhost:9002`

## 현재 제한
- 갤럭시 전용 UX 미완성
- APK 패키징 미완료
- 실기기(윈도우/갤럭시) 자동 원격 QA는 불가, 사용자 측 검증 필요

## 다음 단계(우선순위)
1. 모바일 UX 정식 구현
2. PWA 보강
3. APK(Capacitor) 패키징
4. Always-on 서버 + OAuth/Drive API(필요 시)

## 비용 방향
- 초기: 로컬 + Google Drive Desktop 방식으로 저비용 운영 가능
- 상시 접속 필요 시: Cloud Run 등 서버 필요
- 주요 비용 포인트: 호스팅 + LLM 호출량

## 문서
- 상세 기술 문서: `handoff_tech.md`
- 실기기 런북: `docs/device_runbook_phase2.md`
