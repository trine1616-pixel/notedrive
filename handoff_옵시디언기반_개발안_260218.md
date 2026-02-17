# AI MD 노트 시스템 개발 프로젝트 Handoff

## 1. 목표
* UpNote의 UX 한계를 극복하는 개인용 AI 클라우드 MD 노트 구축.
* M1 맥북프로를 서버로 활용하여 로컬 LLM(Ollama) 기반 자동화 구현.

## 2. 핵심 아키텍처
* **Viewer**: 옵시디언 (로컬 MD 파일 기반).
* **Sync**: Git 또는 S3(Remotely Save)를 통한 기기 간 동기화.
* **Intelligence**: Python Watchdog + Ollama API를 이용한 자동 분류 및 정제.
* **Workflow**: PARA & CODE 시스템 기반.

## 3. 현재까지 진행 상황
* PARA 기반 폴더 구조 및 YAML 메타데이터 스키마 설계 완료.
* M1 맥북 기반의 로컬 LLM 활용 전략 수립.

## 4. 다음 세션 과제
* `00_Inbox` 폴더를 감시하는 Python 기초 스크립트 작성.
* Ollama API를 호출하여 노트를 요약하고 폴더 이동을 추천하는 프롬프트 엔지니어링.
* 맥/윈도우 간 이미지 경로 호환성 해결 방안 구체화.
