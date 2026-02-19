# 아키텍처 (Architecture)

## 시스템 설계 원칙
- **GitHub 중심**: 모든 상태와 문서는 Git으로 관리됨.
- **파일 기반 컨텍스트**: `docs/` 디렉토리 내의 마크다운 파일들을 통해 컨텍스트를 유지.
- **이식성**: OS 종속적인 기능(심볼릭 링크 등)을 배제하고 단순한 파일 구조 유지.

## 디렉토리 구조
- `00_Inbox/`: 정돈되지 않은 새로운 노트들이 들어오는 입구
- `docs/`: 핵심 문서 (Context, Architecture, Tasks, Decisions, Handoff, Changelog)
- `prompts/`: LLM 호출을 위한 프롬프트 템플릿
- `scripts/`: 실행 가능한 자동화 도구 및 런타임 스크립트
- `skills/`: AI의 행동 지침 및 전문 지식 베이스 (PARA 분류 규칙 등)
- `src/agents/`: 역할을 가진 에이전트 팀 (Lead, Librarian, Editor, Inspector)
- `src/utils/`: 공용 유틸리티 (NFC 변환, 파일 핸들링 등)
- `logs/`: 에이전트 팀의 활동 및 작업 실행 로그
- `Obsidian_Vault/`: 최종 결과물이 담기는 지식 창고

## 에이전트 팀 (Agent Team) 아키텍처
Grok과 Claude의 Agent Team 개념을 벤치마킹하여 다음과 같이 역할을 분담합니다.
1. **Lead (Archivist)**: 작업을 분해하고 각 전문가 에이전트에게 노트를 할당. 전체 진행 상황 관리.
2. **Librarian (Classification Specialist)**: PARA 법칙(Skills)에 기반하여 노트의 최적 위치 선정.
3. **Editor (Cleanup Specialist)**: 해시태그 정제, 이미지 경로 수정, NFC 정규화 및 마크다운 포맷팅.
4. **Inspector (Verification Specialist)**: 최종 결과물이 분류 기준에 맞는지, 데이터 손실은 없는지 교차 검증 (환각 방지).
