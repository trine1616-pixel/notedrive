# 아키텍처 (Architecture)

## 시스템 설계 원칙
- **GitHub 중심**: 모든 상태와 문서는 Git으로 관리됨.
- **파일 기반 컨텍스트**: `docs/` 디렉토리 내의 마크다운 파일들을 통해 컨텍스트를 유지.
- **이식성**: OS 종속적인 기능(심볼릭 링크 등)을 배제하고 단순한 파일 구조 유지.

## 디렉토리 구조
- `docs/`: 핵심 문서 (Context, Architecture, Tasks, Decisions, Handoff, Changelog)
- `prompts/`: 세션 관리를 위한 프롬프트 템플릿
- `scripts/`: 자동화 도구 (Handoff 업데이트 등)
- `src/`: 애플리케이션 소스 코드
