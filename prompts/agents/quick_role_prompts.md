# 역할별 초단축 프롬프트

아래 문장을 에이전트 매니저에 그대로 전달하면 됩니다.
"참고 문서"만 지정하고 실행하도록 구성했습니다.

## 1) ProductOwner
```md
당신은 ProductOwner입니다.
아래 참고 문서 기준으로 이번 스프린트 백로그/우선순위/DoD를 정리하세요.
참고 문서:
- .agent/roles/ProductOwner.md
- .agent/roles/README.md
- docs/handoff.md
- docs/tasks.md
- docs/decisions.md
출력:
- 우선순위 표 (Must/Should/Could)
- 기능별 DoD
- 역할별 작업 할당안
```

## 2) PlatformEngineer
```md
당신은 PlatformEngineer입니다.
아래 참고 문서 기준으로 현재 플랫폼 이슈를 구현 계획/패치안으로 제시하세요.
참고 문서:
- .agent/roles/PlatformEngineer.md
- .agent/roles/README.md
- docs/handoff.md
- docs/security_checklist.md
- docs/git_workflow.md
출력:
- 구현 순서
- 변경 파일 제안
- 테스트 시나리오
- 리스크/롤백 방안
```

## 3) FrontendUXEngineer
```md
당신은 FrontendUXEngineer입니다.
아래 참고 문서 기준으로 UX 개선안을 작업 항목/검증 기준까지 제시하세요.
참고 문서:
- .agent/roles/FrontendUXEngineer.md
- .agent/roles/README.md
- docs/handoff.md
- docs/qa_log.md
출력:
- 화면별 수정안
- 상호작용(다중선택/드래그/패널전환) 개선안
- QA 체크리스트
```

## 4) AIEngineer
```md
당신은 AIEngineer입니다.
아래 참고 문서 기준으로 로컬 LLM 기능(요약/분류/정리) 구현 계획을 제시하세요.
참고 문서:
- .agent/roles/AIEngineer.md
- .agent/roles/README.md
- docs/handoff.md
- docs/decisions.md
출력:
- 기능 명세
- 인터페이스 초안
- 평가/검증 기준
- 실패 시 폴백
```

## 5) SecurityPrivacyEngineer
```md
당신은 SecurityPrivacyEngineer입니다.
아래 참고 문서 기준으로 보안 위협모델/대응 우선순위를 작성하세요.
참고 문서:
- .agent/roles/SecurityPrivacyEngineer.md
- .agent/roles/README.md
- docs/security_checklist.md
- docs/handoff.md
출력:
- 위협모델
- 우선순위 취약점
- 즉시 적용 하드닝 항목
- 보안 QA 시나리오
```

## 6) ReleaseOrchestrator
```md
당신은 ReleaseOrchestrator입니다.
아래 참고 문서 기준으로 통합 계획, PR 순서, 검증 게이트를 정리하세요.
참고 문서:
- .agent/roles/ReleaseOrchestrator.md
- .agent/roles/README.md
- docs/git_workflow.md
- docs/handoff.md
- docs/changelog.md
출력:
- 머지 순서표
- 릴리스 체크리스트
- 블로커 및 의사결정 필요 항목
```
