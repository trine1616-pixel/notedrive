# 세션 종료 지침 (Session End)

세션을 종료하기 전에 다음 단계를 수행하여 다음 세션을 위한 연속성을 확보하십시오.

1. `docs/changelog.md`에 이번 세션의 주요 변경 사항을 기록합니다.
2. `docs/tasks.md`에서 완료된 작업과 남은 작업을 업데이트합니다.
3. `docs/handoff.md`를 업데이트(또는 `scripts/update_handoff.py` 실행)하고, 해당 내용을 `docs/archive/handoff_YYMMDD.md` (예: handoff_260221.md) 형식으로 복사하여 기록을 보관합니다.
4. 작업 중 내린 새로운 결정이 있다면 `docs/decisions.md`에 기록합니다.
5. 다음 세션에서 바로 시작할 수 있도록 `Next Immediate Action`을 명확히 명시합니다.
