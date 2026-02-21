# NoteDrive Handoff Technical (상세)

## 1. 아키텍처 개요
- Frontend: Next.js App Router + React + Tiptap
- Storage Abstraction:
  - `local` (파일시스템)
  - `gdrive` (Google Drive API)
- Server Actions 기반 CRUD

## 2. 핵심 구현 상세

### 2.1 Dashboard / 3-pane
- 파일: `notedrive/src/components/dashboard.tsx`
- 구현:
  - 1단/2단/3단 구성
  - Editor-only 모드
  - 사이드바 offcanvas 접힘
  - 1단/2단 드래그 리사이즈
  - 컨텍스트 메뉴(노트/폴더)
  - 태그 필터 및 카운트
  - 휴지통 뷰

### 2.2 Folder / Note UI
- 파일:
  - `notedrive/src/components/folder-tree.tsx`
  - `notedrive/src/components/note-list.tsx`
- 구현:
  - 트리 폴더 렌더링
  - 하위폴더 포함 카운트
  - 노트/폴더 드래그 이동
  - 다중 선택 동작
  - 색상 시인성 개선

### 2.3 Editor / Markdown
- 파일:
  - `notedrive/src/components/rich-editor.tsx`
  - `notedrive/src/components/note-editor.tsx`
  - `notedrive/src/components/extensions/hashtag-extension.ts`
  - `notedrive/src/app/globals.css`
- 구현:
  - Tiptap 기반 Markdown 편집
  - 이미지/파일 첨부 업로드
  - Undo/Redo
  - 해시태그 실시간 추출
  - `#` 자동완성(키보드 내비게이션)
  - 해시태그 토큰 컬러 하이라이트

### 2.4 휴지통 (Soft Delete)
- 파일:
  - `notedrive/src/lib/file-system.ts`
  - `notedrive/src/lib/google-drive.ts`
  - `notedrive/src/lib/storage.ts`
  - `notedrive/src/app/actions.ts`
  - `notedrive/src/lib/types.ts`
- 구현:
  - 노트/폴더 삭제 -> 휴지통 이동
  - 복원/영구삭제 지원
  - 로컬/Drive 양쪽 대응

## 3. 실행/런처

### 3.1 Mac
- 파일:
  - `launch_notedrive_mac.sh`
  - `start_notedrive_daemon.mjs`
  - `stop_notedrive_mac.sh`
- 안정화 내용:
  - `next dev` 기반 오류 회피
  - `clean build -> next start` 방식 고정
  - 포트 충돌 자동 정리

### 3.2 Windows
- 파일:
  - `launch_notedrive_windows.bat`
  - `launch_notedrive_windows.ps1`
  - `stop_notedrive_windows.ps1`
- 동작:
  - 포트 정리 -> 빌드 -> start -> 브라우저 오픈

## 4. 설정

### 4.1 Local Storage
- `.env.local` 예시:
```bash
NOTEDRIVE_STORAGE_PROVIDER=local
NOTEDRIVE_LOCAL_ROOT=../Obsidian_Vault
```

### 4.2 Google Drive Storage
- `.env.local` 예시:
```bash
NOTEDRIVE_STORAGE_PROVIDER=gdrive
GOOGLE_DRIVE_FOLDER_ID=...
GOOGLE_DRIVE_ACCESS_TOKEN=...   # 또는 refresh token 세트
```

## 5. 검증 상태
- 타입체크: 통과
- 빌드: 통과
- Mac localhost 9002: 200 응답 확인

## 6. 알려진 이슈/주의
1. 첫 실행은 build 때문에 지연 가능
2. 모바일 전용 UX는 아직 미완성
3. APK 배포는 별도 단계 필요
4. 실기기 QA는 사용자 측 수행 + 로그 피드백 필요

## 7. 다음 개발 권장 순서
1. 모바일 UX 재설계(단일/스택 내비게이션)
2. PWA 강화
3. Capacitor로 APK화
4. OAuth/Drive API 서버화(상시 사용 시)

## 8. 운영비용 관점
- Drive API 자체는 소규모에서 무료 시작 가능
- 실제 비용은 주로:
  - 호스팅(Cloud Run 등)
  - LLM API 호출량
- 무료 티어 기반 운영 가능하나, 초과 과금 대비 예산 알림 필수

## 9. 관련 문서
- 상위 요약: `handoff_v1.md`
- 기존 통합: `handoff.md`
- 실기기 런북: `docs/device_runbook_phase2.md`
