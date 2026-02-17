import os
import subprocess
from datetime import datetime

def get_git_info():
    try:
        branch = subprocess.check_output(['git', 'rev-parse', '--abbrev-ref', 'HEAD']).decode().strip()
        last_commit = subprocess.check_output(['git', 'log', '-1', '--pretty=%B']).decode().strip()
        changed_files = subprocess.check_output(['git', 'diff', '--name-only', 'HEAD']).decode().strip()
        return branch, last_commit, changed_files
    except Exception as e:
        return "Unknown", str(e), "Unknown"

def update_handoff():
    branch, commit, files = get_git_info()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    handoff_path = os.path.join('docs', 'handoff.md')
    
    content = f"""# 핸드오프 (Handoff) - {now}

## 연속성 정보 (Continuity Context)
- **작업 브랜치**: `{branch}`
- **마지막 커밋**: `{commit}`
- **수정된 파일**:
```
{files}
```

## 현재 상태 요약 (Summary)
(여기에 현재 작업 진행 상황을 수동 또는 자동으로 요약하십시오.)

## 다음 단계 (Next Steps)
1. 
2. 
"""
    with open(handoff_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Handoff updated in {handoff_path}")

if __name__ == "__main__":
    update_handoff()
