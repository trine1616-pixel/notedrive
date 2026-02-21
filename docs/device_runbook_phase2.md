# NoteDrive 2단계 실기기 검증 런북

목표: 갤럭시폰 / 윈도우 / 맥에서 실제 사용 시 구동 문제를 확인한다.

## 1. 공통 사전조건
- Node.js 20+ 설치
- `notedrive/.env.local` 설정 완료
- 포트 `9002`가 방화벽/보안앱에 의해 차단되지 않아야 함

## 2. 맥 실행/중지
- 실행: `NoteDrive.app` 더블클릭
- 수동 실행: `./launch_notedrive_mac.sh`
- 중지: `./stop_notedrive_mac.sh`
- 확인 URL: `http://localhost:9002`

## 3. 윈도우 실행/중지
- 실행(권장): `launch_notedrive_windows.bat` 더블클릭
- 실행(PS): `powershell -ExecutionPolicy Bypass -File .\launch_notedrive_windows.ps1`
- 중지(PS): `powershell -ExecutionPolicy Bypass -File .\stop_notedrive_windows.ps1`
- 확인 URL: `http://localhost:9002`

## 4. 갤럭시폰 실행 방식
갤럭시에 로컬 서버를 직접 띄우는 방식보다, 맥/윈도우에서 띄운 서버에 접속하는 방식을 권장.

- 맥/윈도우에서 서버 실행 후 같은 Wi‑Fi에 연결
- PC의 LAN IP 확인
  - 맥: `ipconfig getifaddr en0` (Wi‑Fi 기준)
  - 윈도우: `ipconfig` 후 IPv4 주소 확인
- 갤럭시 브라우저에서 `http://<PC_IP>:9002` 접속

예: `http://192.168.0.15:9002`

## 5. 필수 검증 시나리오 (각 기기 동일)
1. 앱 진입/초기 로딩 성공 (`200 OK`, 흰 화면/500 없음)
2. 1단 폴더 선택 시 2단 목록 정상 갱신
3. 노트 생성/수정/저장 후 재접속 시 데이터 유지
4. 폴더/노트 드래그 이동
5. 우클릭 메뉴(이름변경/삭제/새 폴더) 동작
6. 휴지통: 삭제 -> 복원 -> 영구삭제
7. 사이드바 숨김/복귀 시 레이아웃 겹침 없음
8. 1단/2단 폭 드래그 조절
9. 이미지 업로드/첨부 링크 삽입
10. 다크/라이트/시스템 테마 전환

## 6. 실패 시 즉시 확인할 로그
- 맥: `logs/notedrive_server.log`
- 윈도우: `logs/notedrive_server_windows.log`

핵심 에러 패턴:
- `EADDRINUSE`: 이미 포트 9002 사용 중
- `ENOENT .next ...`: 빌드 산출물 꼬임 (런처 재실행으로 복구)
- `Internal Server Error`: 서버 로그에서 스택 확인 필요

## 7. 현재 상태에서의 현실적 한계
- 이 환경에서 갤럭시/윈도우 실기기 직접 원격 제어 검증은 불가
- 대신 위 런북으로 동일 절차 검증이 가능하고, 실패 로그를 받으면 즉시 수정 가능
