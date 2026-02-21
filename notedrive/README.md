# NoteDrive App Guide

NoteDrive는 UpNote 스타일 3-pane UX를 기반으로, Markdown 파일을 로컬 또는 Google Drive에 저장할 수 있는 노트 앱입니다.

## 현재 지원 기능 (Current Features)
- 3-pane UI: 폴더 / 노트 목록 / 에디터
- Markdown 편집 + AI 요약 버튼
- 실제 파일 저장/생성/이동/삭제
- 휴지통(복원/영구삭제)
- 해시태그 실시간 반영 + 자동완성 + 하이라이트
- 스토리지 모드 전환
  - `local`: 로컬 폴더 저장
  - `gdrive`: Drive API를 통한 직접 저장

## 환경 설정 (.env.local)

### 1) Local 모드 (기본 권장)
```bash
NOTEDRIVE_STORAGE_PROVIDER=local
# 선택값: 미지정 시 ../Obsidian_Vault 사용
NOTEDRIVE_LOCAL_ROOT=../Obsidian_Vault
```

설명:
- Windows/Mac에서 Google Drive Desktop을 로컬 폴더처럼 연결해 쓰려면 보통 이 모드가 가장 단순합니다.

### 2) Google Drive API 모드
```bash
NOTEDRIVE_STORAGE_PROVIDER=gdrive
GOOGLE_DRIVE_FOLDER_ID=your_target_folder_id

# 옵션 A: 고정 Access Token (빠른 테스트)
GOOGLE_DRIVE_ACCESS_TOKEN=ya29....

# 옵션 B: Refresh Token 기반 (장기 운영)
GOOGLE_DRIVE_CLIENT_ID=...
GOOGLE_DRIVE_CLIENT_SECRET=...
GOOGLE_DRIVE_REFRESH_TOKEN=...
```

권한 스코프:
- `https://www.googleapis.com/auth/drive.file`
- 또는 `https://www.googleapis.com/auth/drive`

## 실행 방법

### 개발 모드 (빠른 개발용)
```bash
npm install
npm run dev -- -p 9002
```

### 프로덕션 모드 (안정 실행용)
```bash
npm install
npm run build
npm run start -- -p 9002
```

## 운영 참고
- 루트 실행 스크립트: `../run_notedrive.sh`
- Windows 실행 스크립트: `../scripts/launch_notedrive_windows.bat`
- 실기기 점검 런북: `../docs/device_runbook_phase2.md`

## 현재 한계와 다음 단계
- 모바일 전용 UX는 계속 고도화가 필요합니다.
- 갤럭시 APK 배포는 별도 단계(Capacitor 등)에서 진행해야 합니다.
- 상시 접속(Always-on)이 필요하면 Cloud Run 같은 서버 운영 구성이 필요합니다.
