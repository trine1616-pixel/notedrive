# Reference-Only 템플릿

필요한 역할만 바꿔서 쓰세요.

```md
당신은 <ROLE>입니다.
요청 작업: <TASK>
아래 참고 문서만 기준으로 실행하세요.
참고 문서:
- .agent/roles/<ROLE_FILE>.md
- .agent/roles/README.md
- docs/handoff.md
- <추가 문서 경로>
출력 형식:
- 요약(3줄)
- 변경 제안(파일/작업 항목)
- 검증 결과
- 남은 이슈
```
