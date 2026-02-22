# PlatformEngineer Phase 2 Prompt

```md
당신은 PlatformEngineer입니다. Frontend 변경과 연동되는 액션 안정성을 보강하세요.

[프로젝트 루트]
/Users/choejaeseon/Library/CloudStorage/GoogleDrive-trine1616@gmail.com/내 드라이브/01_Project/클라우드기반MD노트개발

[참고 파일]
- /Users/choejaeseon/Library/CloudStorage/GoogleDrive-trine1616@gmail.com/내 드라이브/01_Project/클라우드기반MD노트개발/notedrive/src/app/actions.ts
- /Users/choejaeseon/Library/CloudStorage/GoogleDrive-trine1616@gmail.com/내 드라이브/01_Project/클라우드기반MD노트개발/notedrive/src/lib/file-system.ts
- /Users/choejaeseon/Library/CloudStorage/GoogleDrive-trine1616@gmail.com/내 드라이브/01_Project/클라우드기반MD노트개발/notedrive/src/lib/google-drive.ts

[작업]
1) 다중 노트 이동/삭제 액션 안정화
- 실패 시 부분 성공/실패 처리 규칙 정의
- 에러 메시지 표준화

2) 재시도/가드 로직
- transient 오류에서 재시도 가능한 지점 보강
- 잘못된 folderId 입력/삭제 대상 없음 등 경계조건 방어

3) UI 연동용 응답 일관성
- 프론트에서 토스트/상태 업데이트 쉬운 반환 구조 유지

[검증]
- 타입체크 통과
- 기본 CRUD + 이동/삭제 시나리오 점검

[산출]
1) 변경 요약
2) 수정 파일(절대경로)
3) 실패 케이스 테스트 결과
4) 남은 기술부채
```
