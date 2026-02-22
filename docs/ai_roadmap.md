# AI (Ollama) 연동 우선순위 및 로드맵 제안

현재 P1 블로커인 AI 연동 우선순위(병렬 vs 순차)에 대한 ReleaseOrchestrator의 제안입니다.

## 1. 구현 전략 비교

| 전략 | 장점 | 단점 | 추천 여부 |
| :--- | :--- | :--- | :--- |
| **순차적 진행 (Sequential)** | 모바일 UX 안정화 후 진행하므로 품질 제어 용이, 리소스 분산 방지 | 전체 출시 일정 지연 가능성 | **최우선 추천** |
| **병렬적 진행 (Parallel)** | 기능 출시 속도 극대화 | 모바일 UX와 AI 연동 간의 충돌(리소스 레이스 등) 위험, 검증 복잡도 증가 | 비추천 |

## 2. 제안 로드맵 (순차적 방식)

1.  **Phase 1: Foundation (현재)**
    - 모바일 UX 고도화 (키보드 포커스, FAB 안정화)
    - Cloud Run 배포 환경 및 비용 가드레일 확정
2.  **Phase 2: AI Core Integration (Phase 1 완료 후)**
    - 로컬 Ollama API 프록시 계층 구현
    - 기본 요약(Summarize) 및 분류(Classification) 기능 활성화
3.  **Phase 3: Optimization**
    - 모바일 환경에서의 AI 처리 UI/UX 최적화 (Progress indicator 등)

## 3. 의사결정 요청 사항
- **Product Owner**: 위 로드맵(Phase 1 집중 후 Phase 2 진입)에 동의하시나요?
- **Platform Engineer**: Ollama 서버를 로컬에 둘지, 별도 GPU 인스턴스를 활용할지에 대한 비용 검토가 Phase 2 진입 전 필요합니다.
