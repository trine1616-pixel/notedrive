# NoteDrive Project

NoteDrive는 개인용 클라우드 기반 Markdown 노트 보관 및 관리 시스템입니다. 데스크톱과 모바일(PWA) 환경을 모두 지원하며, 로컬 파일 시스템과 Google Drive 동기화를 지원합니다.

## 프로젝트 구조

- `notedrive/`: Next.js 기반의 메인 웹 애플리케이션 (React, Tiptap, Tailwind CSS)
- `scripts/`: 플랫폼별 실행 및 보조 스크립트 (Windows .bat, .ps1 등)
- `docs/`: 프로젝트 문서 및 히스토리 아카이브
- `legacy/`: 이전 버전의 Python 기반 에이전트 코드 (참고용)
- `Handoff/`: LLM 세션 간 연속성 유지를 위한 컨텍스트 문서

## 시작하기

맥OS 또는 리눅스 환경에서 애플리케이션을 실행하려면 루트 폴더에서 다음 스크립트를 실행하세요:

```bash
chmod +x run_notedrive.sh
./run_notedrive.sh
```

이 스크립트는 자동으로 의존성을 확인하고, 개발 서버를 `http://localhost:9002`에서 실행하며 브라우저를 엽니다.

## 주요 기능

- **3-Pane Layout**: 데스크톱에서의 직관적인 탐색 (폴더 / 노트 목록 / 에디터)
- **Responsive Design**: 모바일에 최적화된 스택형 UI 및 뒤로가기 내비게이션
- **PWA 지원**: 홈 화면 추가 및 설치 가능
- **Multi-Storage**: 로컬 파일 시스템 또는 Google Drive 선택 가능
- **AI Summary**: 노트를 요약해주는 AI 기능 내장

## 개발 환경 설정

애플리케이션의 상세 설정은 `notedrive/README.md`를 참고하세요.
