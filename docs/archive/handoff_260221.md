# NoteDrive Project Handoff

이 문서는 NoteDrive 프로젝트의 초기 구현부터 Phase 2(모바일/PWA), Phase 3(GitHub/정리), 그리고 UI 고도화까지의 전체 상태와 기술적 세부 사항을 총망라한 통합 Handoff 문서입니다.

## 1. 프로젝트 상태 및 최근 개발 요약

### 1.1 Mobile UI Refinement (UpNote Style)
- **Bottom Navigation**: 단일 pane 모바일 뷰 하단에 내비게이션 바 추가 (검색 및 더보기 기능 탑재).
- **FAB (Floating Action Button)**: 우측 하단에 파란색 원형 새 노트 작성 버튼 추가.
- **노트 리스트 고도화**: 헤더 타이틀 중앙 정렬, 햄버거 메뉴 좌측 배치, 타이포그래피 및 간격 최적화.
- **접근성(Accessibility)**: Radix UI `SheetContent`의 누락된 `DialogTitle` 경고를 `VisuallyHidden`으로 해결.

### 1.2 Phase 2: Mobile UX & PWA
- **반응형 패널**: 768px 미만에서 3-pane -> 단일 pane으로 자동 전환.
- **모바일 내비게이션**: 에디터 내 '뒤로 가기' 버튼 및 뷰 전환 로직 구현.
- **PWA 설정**: `manifest.json` 및 `next-pwa`를 통한 설치 가능 웹앱 기반 구축.
- **에러 핸들링**: 서버 액션(`actions.ts`)의 예외 처리를 강화하여 구체적인 에러 메시지 반환.

### 1.3 Phase 1 & 3: 핵심 기능 및 Cleanup
- **핵심 UI 구현 완료**: 3-pane 노트 UI, 폴더/노트 드래그 이동, 다중 선택, 색상 변경, 휴지통(복원/영구삭제) 지원.
- **에디터 고도화**: Tiptap 기반 Markdown 편집, 이미지/파일 첨부, 해시태그 실시간 추출/하이라이트/자동완성.
- **구조 정리**: 레거시 코드(`legacy/`), 문서 아카이브(`docs/archive/`), 스크립트 중앙화(`scripts/`) 완료.
- **보안/제외**: `.gitignore` 고도화로 개인 데이터 및 빌드 파일 차단.

## 2. 아키텍처 및 구현 상세

### 2.1 아키텍처 개요
- **Frontend**: Next.js App Router + React + Tiptap
- **Storage Abstraction**:
  - `local` (파일시스템)
  - `gdrive` (Google Drive API)
- **로직 처리**: Server Actions 기반 CRUD

### 2.2 Dashboard / 3-pane (`dashboard.tsx`)
- 1단/2단/3단 모드 및 Editor-only 모드.
- 오프캔버스 사이드바 및 패널 드래그 리사이즈.
- 태그 필터 / 컨텍스트 메뉴(노트, 폴더) 분리.

### 2.3 Editor / Markdown (`rich-editor.tsx`, `note-editor.tsx`)
- Tiptap 플러그인 확장 (`hashtag-extension.ts`, `globals.css`).
- Undo/Redo 완벽 지원.

### 2.4 휴지통 (Soft Delete)
- `lib/file-system.ts`, `lib/google-drive.ts`, `lib/storage.ts`
- 노트/폴더 삭제 시 휴지통 이동 지원 및 복원 보장.

## 3. 실행 및 런처 가이드

### 3.1 환경 설정 (`.env.local`)
- **Local Storage**:
  ```bash
  NOTEDRIVE_STORAGE_PROVIDER=local
  NOTEDRIVE_LOCAL_ROOT=../Obsidian_Vault
  ```
- **Google Drive Storage**:
  ```bash
  NOTEDRIVE_STORAGE_PROVIDER=gdrive
  GOOGLE_DRIVE_FOLDER_ID=...
  GOOGLE_DRIVE_ACCESS_TOKEN=...
  ```

### 3.2 런처 실행 스크립트
1. 루트 디렉토리에서 터미널 오픈.
2. `./run_notedrive.sh` 실행. (Mac 환겨의 경우 `launch_notedrive_mac.sh`, `start_notedrive_daemon.mjs`으로도 안정적 동작 보장 - 포트 충돌 자동 정리 및 `next start` 방식 고정)
3. Windows 환경일 경우 `launch_notedrive_windows.bat` 또는 `launch_notedrive_windows.ps1` 실행.
4. 브라우저에서 `http://localhost:9002` 접속.

## 4. 모바일/PWA 확인 방법
1. **반응형 테스트**: 브라우저 개발자 도구(F12) -> Device Mode(Cmd+Shift+M)에서 모바일 해상도로 변경 (자동으로 단일 pane 패널 및 Bottom Nav가 나타남).
2. **PWA 테스트**: 주소창 우측의 '설치' 아이콘 또는 개발자 도구의 'Application' 탭 -> 'Manifest'에서 설정값 확인 및 단독 앱으로 설치.

## 5. 알려진 제한사항 및 다음 개발 목표
- 갤럭시 화면 등 일부 모바일 환경에서의 가상 키보드 자동 포커싱 로직 개선. (현재 작업 대기 중)
- Android APK 패키징(예: Capacitor 활용) 단계 추가 필요.
- 맥/윈도우 간 하드 코딩된 로컬 이미지 경로 호환성 확보 문제.
- 모바일 실기기 원격 QA 자동화는 불가하므로 사용자 피드백 의존.

## 6. GitHub 정보
- **Remote**: `https://github.com/trine1616-pixel/notedrive`
- **Branch**: `main` (초기화 및 푸시 완료)
