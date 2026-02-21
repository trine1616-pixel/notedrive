# 아키텍처 (Architecture)

최종 업데이트: 2026-02-21

## 설계 원칙
- 단일 실행 가능한 제품을 우선한다. (문서/코드/실행 경로 일치)
- 로컬 Markdown 호환성을 유지한다. (Obsidian 상호운용)
- 사용자 실수 복구를 우선한다. (휴지통 기반 soft delete)
- 모바일 확장을 고려한 단계적 아키텍처를 채택한다.

## 현재 아키텍처 (As-Is)

### 1) 애플리케이션 레이어
- `notedrive/`의 Next.js 앱이 UI와 서버 액션을 함께 담당한다.
- 핵심 UI는 3-pane 구조(폴더/노트목록/에디터)다.
- 에디터는 Tiptap 기반이며 해시태그 실시간 인식/자동완성을 제공한다.

### 2) 스토리지 레이어
- 추상화 진입점: `notedrive/src/lib/storage.ts`
- 구현체:
  - 로컬 파일 시스템: `notedrive/src/lib/file-system.ts`
  - Google Drive API: `notedrive/src/lib/google-drive.ts`
- 선택 방식: `.env.local`의 `NOTEDRIVE_STORAGE_PROVIDER` (`local` 또는 `gdrive`)

### 3) 데이터 안정성 레이어
- 삭제는 즉시 삭제가 아닌 휴지통 이동(soft delete)으로 처리한다.
- 복원/영구삭제는 서버 액션을 통해 수행한다.
- 관련 액션: `notedrive/src/app/actions.ts`

### 4) 실행/런타임 레이어
- 개발 실행: `run_notedrive.sh` (dev 서버)
- Windows 실행: `scripts/launch_notedrive_windows.bat`
- macOS 안정 실행(보조): `scripts/runtime_backup/` 내 런처 기반 `clean build -> start`

## 디렉토리 역할 (운영 기준)
- `notedrive/`: 앱 코드 본체
- `docs/`: 운영 문서(Tasks/Decisions/Handoff 포함)
- `scripts/`: 실행/보조 자동화 스크립트
- `Obsidian_Vault/`: 로컬 Markdown 저장소
- `prompts/`, `skills/`: 에이전트 운영 리소스

## 다음 아키텍처 (To-Be: Always-on)

### 목표
- PC 상시 실행 없이 모바일/데스크톱에서 상시 접근 가능한 운영 구조로 전환한다.

### 제안 구조
1. Frontend: 현재 Next.js UI 유지
2. Backend: Cloud Run에 앱/API 배포
3. Auth: Google OAuth 서버 처리 (토큰 보안 관리)
4. Storage: Drive API 또는 하이브리드(local 동기화) 전략 선택
5. Ops: 예산 알림/쿼터 가드레일로 0원 근접 운영

### 전환 조건
- 모바일 UX 고도화 완료
- OAuth/토큰 보관 정책 확정
- 배포 파이프라인/비용 모니터링 정책 확정

## ADR 연동
- 스토리지 기본 전략: `docs/decisions.md` ADR-005
- 휴지통 정책: `docs/decisions.md` ADR-006
- 태그 UX 정책: `docs/decisions.md` ADR-007
- 모바일 UX 패턴: `docs/decisions.md` ADR-008
- Always-on 전환 방향: `docs/decisions.md` ADR-010
