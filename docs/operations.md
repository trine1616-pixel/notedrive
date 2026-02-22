# NoteDrive 운영 가이드 (Operations Guide)

이 문서는 NoteDrive 플랫폼의 로컬 실행, 클라우드 배포, 시크릿 관리 및 인프라 운영 방식을 정리한 단일 진실 공급원입니다.

## 1. 프로젝트 구조 및 환경 설정

앱 소스 코드는 `notedrive/` 디렉토리에 위치하며, Next.js 프레임워크를 사용합니다.

### 필수 시크릿 (Environment Variables)
`.env.local` 또는 환경변수에 다음 항목이 설정되어야 합니다:

| 변수명 | 설명 |
| :--- | :--- |
| `NOTEDRIVE_STORAGE_PROVIDER` | `local` 또는 `gdrive` (기본값: `local`) |
| `GOOGLE_DRIVE_FOLDER_ID` | `gdrive` 모드시 파일을 저장할 루트 폴더 ID |
| `GOOGLE_DRIVE_CLIENT_ID` | Google OAuth 클라이언트 ID |
| `GOOGLE_DRIVE_CLIENT_SECRET` | Google OAuth 클라이언트 시크릿 |
| `GOOGLE_DRIVE_REFRESH_TOKEN` | 오프라인 액세스를 위한 Refresh Token |

## 2. 실행 가이드 (Execution)

### 로컬 실행 (macOS)
```bash
./run_notedrive.sh
```
- 의존성 설치, 클린 빌드 후 `http://localhost:9002`에서 서비스를 시작합니다.
- `local` 모드인 경우 현재 디렉토리의 파일을 메모리에 로드하여 편집합니다.

### 로컬 실행 (Windows)
```powershell
.\scripts\launch_notedrive_windows.bat
```

## 3. 인프라 및 배포 (Infrastructure & Deployment)

### Docker 기반 실행 (Always-on)
1. **이미지 빌드**:
   ```bash
   cd notedrive
   docker build -t notedrive .
   ```
2. **컨테이너 실행**:
   ```bash
   docker run -p 3000:3000 --env-file .env.local notedrive
   ```

### Google Cloud Run 배포
자동화 스크립트를 사용하여 Seoul 리전(`asia-northeast3`)에 배포합니다.
```bash
./scripts/deploy_cloudrun.sh
```
- **비용 최적화**: `max-instances=1`로 설정되어 비용 발생을 최소화합니다.
- **보안**: 운영 환경에서는 Secret Manager를 통해 민감 정보를 주입하는 것을 권장합니다.

## 4. QA 및 검증 절차

운영 환경 배포 전 다음 사항을 확인하십시오:
1. **인증 검증**: 설정 메뉴에서 Google Drive 연동 상태가 '정상'인지 확인.
2. **CRUD 테스트**: 노트 생성 -> 수정 -> 폴더 이동 -> 휴지통 이동 -> 복원/영구삭제 흐름 확인.
3. **태그 시스템**: `#tag` 입력 시 자동완성 및 하이라이트가 정상 작동하는지 확인.
4. **모바일 뷰**: 브라우저 개발자 도구에서 모바일 환경(Touch)으로 전환 시 UI 레이아웃이 깨지지 않는지 확인.

## 5. 리스크 및 장애 대응 (Rollback)

- **배포 장애**: `deploy_cloudrun.sh` 실행 중 오류 시 이전 Revision으로 트래픽을 즉시 전환합니다.
- **인증 만료**: `Invalid grant` 에러 발생 시 `GOOGLE_DRIVE_REFRESH_TOKEN`을 재발급하여 환경변수를 업데이트합니다.
- **데이터 유출 방지**: 로그에 토큰이나 개인 데이터가 남지 않도록 상시 점검합니다 (`docs/security_checklist.md` 참고).

---
관련 문서: [project_context.md](file:///Users/choejaeseon/Library/CloudStorage/GoogleDrive-trine1616@gmail.com/내 드라이브/01_Project/클라우드기반MD노트개발/docs/project_context.md), [tasks.md](file:///Users/choejaeseon/Library/CloudStorage/GoogleDrive-trine1616@gmail.com/내 드라이브/01_Project/클라우드기반MD노트개발/docs/tasks.md)
