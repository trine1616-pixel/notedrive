# NoteDrive

NoteDrive는 UpNote 스타일의 3-pane UX와 Markdown 기반 파일 저장(Obsidian 호환)을 결합한 노트 앱입니다.

## 프로젝트 구조
- `notedrive/`: Next.js 앱 본체 (에디터/폴더/노트 기능)
- `docs/`: 아키텍처, 의사결정, 작업현황, 핸드오프 문서
- `scripts/`: 실행/정리/보조 자동화 스크립트
- `Obsidian_Vault/`: 로컬 Markdown 저장소
- `prompts/`, `skills/`: 에이전트 운영 관련 리소스

문서 시작점:
- `docs/docs_map.md`
- `docs/tasks.md`
- `docs/handoff.md`

## 실행 방법

기본 포트: `9002`

### macOS (공식 실행 경로)
```bash
chmod +x run_notedrive.sh
./run_notedrive.sh
```

설명:
- `run_notedrive.sh`는 내부적으로 안정 실행 런처(`launch_notedrive_mac.sh`)를 호출합니다.
- 첫 실행은 `clean build`로 인해 시간이 더 걸릴 수 있습니다.

### Windows
```powershell
.\scripts\launch_notedrive_windows.bat
```

접속:
- `http://localhost:9002`

## 현재 구현 상태 (요약)
- 3-pane UI(폴더/노트목록/에디터) 및 Editor-only 전환
- 폴더/노트 생성, 이동(DnD), 이름변경, 삭제
- 휴지통(복원/영구삭제) 지원
- 폴더 다중 선택 및 일괄 색상 변경
- 이미지/파일 첨부 업로드
- 해시태그 실시간 반영 + 자동완성 + 하이라이트
- 다크/라이트/시스템 테마 지원

## 참고 문서
- 앱 설정/스토리지 모드: `notedrive/README.md`
- 실기기 검증 런북: `docs/device_runbook_phase2.md`
- QA 실행 로그: `docs/qa_log.md`
- 변경 이력: `docs/changelog.md`
