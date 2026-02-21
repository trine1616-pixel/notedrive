# NoteDrive Handoff

## 1) 프로젝트 개요
- 프로젝트: UpNote 스타일 3-pane Markdown 노트 앱 (`notedrive`)
- 핵심 목표:
  - 폴더/노트 구조 기반 Markdown 작성
  - Google Drive 연동 가능한 저장 전략
  - Mac/Windows/Galaxy에서 사용 가능한 구조

## 2) 현재 구현 완료 상태 (1차 완성)
### A. UI/UX
- 3-pane 구조 안정화
  - 1단: 폴더 트리
  - 2단: 노트 목록(+하위 폴더 표시)
  - 3단: 에디터
- 1단/2단 스크롤 독립
- 에디터 전용 모드(Editor Only) 전환
- 사이드바 접기/펼치기 레이아웃 겹침 문제 해결
- 1단/2단 폭 드래그 리사이즈 지원
- 중복 토글 UI 제거 (Editor Only 토글 단일화)

### B. 노트/폴더 동작
- 폴더/노트 생성, 이동(드래그 앤 드롭), 이름변경, 삭제
- 우클릭 컨텍스트 메뉴 구현
- 폴더 다중 선택 + 다중 이동
- 폴더 색상 변경
- 다중 선택 폴더 색상 일괄 변경
- 하위 폴더 포함 노트 개수 집계

### C. 에디터/Markdown
- Tiptap 기반 Markdown 편집
- 이미지/파일 첨부(업로드 후 삽입)
- Undo/Redo 버튼
- 해시태그 실시간 반영
- 해시태그 자동완성 시스템
  - `#` 입력 시 추천 드롭다운
  - 방향키/Enter/Tab 선택
  - 본문 해시태그 컬러 하이라이트

### D. 휴지통(실데이터 복원)
- 삭제 시 즉시 영구삭제가 아니라 휴지통 이동
- 휴지통 뷰에서 복원/영구삭제 지원
- 노트/폴더 모두 지원
- 로컬 스토리지 + Google Drive 스토리지 모두 대응

### E. 테마/기타
- 다크/라이트/시스템 테마 대응
- 태그 목록/카운트 표시
- AI 요약 버튼 연결

## 3) 실행 환경 및 런처

### Mac
- 앱 실행: `NoteDrive.app` 더블클릭
- 스크립트 실행: `./launch_notedrive_mac.sh`
- 중지: `./stop_notedrive_mac.sh`

#### 안정화 처리 내용
- 초기 `Internal Server Error` 원인:
  - `next dev/turbopack` 런타임 산출물 꼬임
- 조치:
  - 런처를 `clean build -> next start` 기반으로 전환
  - 포트(9002) 기존 프로세스 자동 정리
- 결과:
  - `http://localhost:9002` 응답 200 확인

### Windows
- 추가된 실행 스크립트:
  - `launch_notedrive_windows.bat`
  - `launch_notedrive_windows.ps1`
  - `stop_notedrive_windows.ps1`

### Galaxy
- 현재는 모바일 UX 최적화 전 단계
- 같은 네트워크에서 서버 접속형 사용 가능: `http://<PC_IP>:9002`

## 4) 문서
- 실기기 검증 런북:
  - `docs/device_runbook_phase2.md`

## 5) 현재 구조에서 중요한 결정사항

### 저장 전략
- 로컬 모드(`NOTEDRIVE_STORAGE_PROVIDER=local`) + Google Drive Desktop 동기화 사용 가능
- 이 경우 Mac/Windows에서 로컬 파일처럼 사용하면서 Drive 동기화 가능

### Drive API 필수 여부
- 필수 아님:
  - 중앙 서버(PC/클라우드)에 접속하는 방식이면 API 없이도 운영 가능
- 필요해지는 경우:
  - 갤럭시 APK가 단독으로 Drive 로그인/동기화까지 직접 처리하려는 경우

## 6) 알려진 제한/주의
- 첫 실행은 느릴 수 있음(클린 빌드 수행)
- 갤럭시 전용 UX/UI는 아직 미완성
- APK 배포는 아직 미구현 (웹앱 단계)
- 이 환경에서는 실제 갤럭시/윈도우 실기기 원격 제어 테스트는 불가(사용자 측 검증 필요)

## 7) 다음 단계(권장 우선순위)

### Step 1: 모바일 UX 정식 구현
- 모바일에서 3-pane 고정 제거
- `폴더 -> 노트목록 -> 에디터` 스택/탭 전환
- 하단 탭바/모바일 네비게이션/FAB
- 키보드/스크롤/터치 인터랙션 최적화

### Step 2: PWA 지원 강화
- 설치 가능한 웹앱
- 오프라인 캐시 정책 정리
- 모바일 홈화면 바로가기 동작 검증

### Step 3: APK 패키징
- Capacitor 기반 안드로이드 패키징
- 파일/공유/딥링크 권한 정리
- 실제 갤럭시 실기기 QA

### Step 4: Always-on 서버 + OAuth/Drive API(선택)
- 사용자가 항상 PC를 켤 수 없으면 클라우드 서버 필요
- 추천: Cloud Run + OAuth 서버 처리 + Drive API
- 무료 티어 기반 0원 운영 시도 가능(초과 시 과금 가능)

## 8) 비용 관점 요약
- Drive API만 붙였다고 바로 과금되는 구조는 아님
- 실제 비용 주요 포인트:
  - 호스팅(Cloud Run 등)
  - LLM API 호출량
- 무료 티어 내 운영은 가능하지만, 초과 시 과금될 수 있으므로 예산 알림 설정 필수

## 9) 즉시 점검 체크리스트
1. Mac에서 `NoteDrive.app` 실행 후 200 응답 확인
2. 폴더/노트 CRUD + 드래그 이동
3. 해시태그 자동완성/하이라이트 동작 확인
4. 휴지통 복원/영구삭제 동작 확인
5. Windows 스크립트로 동일 시나리오 검증
6. Galaxy 접속 테스트(같은 Wi-Fi)

## 10) 주요 파일(핵심)
- 앱 메인:
  - `notedrive/src/components/dashboard.tsx`
- 에디터:
  - `notedrive/src/components/rich-editor.tsx`
  - `notedrive/src/components/note-editor.tsx`
  - `notedrive/src/components/extensions/hashtag-extension.ts`
- 폴더/노트 리스트:
  - `notedrive/src/components/folder-tree.tsx`
  - `notedrive/src/components/note-list.tsx`
  - `notedrive/src/components/tag-list.tsx`
- 서버 액션:
  - `notedrive/src/app/actions.ts`
- 저장소 계층:
  - `notedrive/src/lib/storage.ts`
  - `notedrive/src/lib/file-system.ts`
  - `notedrive/src/lib/google-drive.ts`
  - `notedrive/src/lib/types.ts`
- 스타일:
  - `notedrive/src/app/globals.css`
- 실행 런처:
  - `launch_notedrive_mac.sh`
  - `start_notedrive_daemon.mjs`
  - `launch_notedrive_windows.bat`
  - `launch_notedrive_windows.ps1`
  - `stop_notedrive_windows.ps1`

