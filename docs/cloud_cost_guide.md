# Cloud Run 비용 가드레일 및 Free Tier 가이드

NoteDrive를 Google Cloud에 배포할 때 월 비용 0원(Free Tier)을 유지하기 위한 설정 가이드입니다.

## 1. 개별 서비스별 Free Tier 한도 (월간)

| 서비스 | Free Tier 한도 | 비고 |
| :--- | :--- | :--- |
| **Cloud Run** | vCPU 18만 초 / GiB 36만 초 / 요청 200만 건 | CPU는 요청 처리 중에만 할당되도록 설정 필요 |
| **Artifact Registry** | 0.5 GB 스토리지 | 불필요한 이미지 빌드 버전 자동 삭제 정책 필요 |
| **Secret Manager** | 활성 보안 비밀 버전 6개 | OAuth client secret 등 최소한의 정보만 저장 |
| **Logging** | 50 GiB 수집 | 로그 수준을 `error` 또는 `warn`으로 제한 권장 |

## 2. 권장 리소스 제한 (Cloud Run)

배포 시 다음 설정을 적용하여 우발적인 비용 발생을 방지합니다:

- **CPU 할당**: `CPU is only allocated during request processing` (Always-on 해제)
- **최소 인스턴스**: `0` (요청이 없을 때 인스턴스 미유지)
- **최대 인스턴스**: `1`~`2` (트래픽 폭주 시 비용 방어)
- **메모리 제한**: `512Mi` (NoteDrive SSR 구동에 충분한 최소 사양)
- **CPU 제한**: `1 vCPU`

## 3. 비용 방어 설정 (Billing)

1.  **예산 알림 (Budget Alerts)**: 월 $1.00 도달 시 이메일 알림 설정.
2.  **Artifact Registry 삭제 정책**: 최신 1~2개 태그만 유지하고 나머지는 자동 삭제하도록 `cleanup policies` 설정.

## 4. Next Step
- `apphosting.yaml` 또는 Cloud Run 배포 스크립트에 위 제약 사항 반영.
- OAuth 인증 정보 및 주소 확정 시 `Secret Manager` 연동 테스트 진행.
