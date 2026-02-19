import os
import time
import json
import requests
import shutil
import re
import unicodedata

# Configuration
SOURCE_ROOT = "ref_upnote/upnote_export_260213"
TARGET_ROOT = "Obsidian_Vault"
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "gemma3:12b"
PROMPT_FILE = "prompts/summarize_note.md"

# 카테고리 매핑 (Plural 일원화)
CATEGORY_MAP = {
    "01_Project": "01_Projects",
    "02_Area": "02_Areas",
    "03_Resource": "03_Resources",
    "99_Archive": "04_Archives",
    "Project": "01_Projects",
    "Area": "02_Areas",
    "Resource": "03_Resources",
    "Archive": "04_Archives"
}

# 허용된 태그
ALLOWED_TAGS = {'raw', 'code', 'distilled', 'final', 'vp', 'family', 'reference', 'checklist', 'it', 'distill', 'unreal', 'disguise'}

def normalize_nfc(text):
    return unicodedata.normalize('NFC', text)

def clean_inline_hashtags(content):
    pattern = r'(?<!\w)#([a-zA-Z0-9_\uAC00-\uD7A3]+)'
    lines = content.split('\n')
    cleaned_lines = []
    for line in lines:
        if re.match(r'^#{1,6}\s', line):
            cleaned_lines.append(line)
            continue
        cleaned_line = re.sub(pattern, lambda m: m.group(0) if m.group(1).lower() in ALLOWED_TAGS else f"\\#{m.group(1)}", line)
        cleaned_lines.append(cleaned_line)
    return '\n'.join(cleaned_lines)

def fix_image_paths(content, target_folder):
    # Obsidian_Vault 루트 기준 Files 폴더 위치 (항상 root에 있다고 가정)
    # depth에 따라 ../ 개수 조절
    depth = target_folder.count('/')
    prefix = "../" * depth
    pattern = r'!\[(.*?)\]\(Files/(.*?)\)'
    replacement = f'![\\1]({prefix}Files/\\2)'
    return re.sub(pattern, replacement, content)

def get_ai_analysis(content, prompt_template):
    try:
        prompt = prompt_template.replace("{{note_content}}", content)
        response = requests.post(OLLAMA_URL, json={
            "model": MODEL_NAME, "prompt": prompt, "format": "json", "stream": False
        }, timeout=60)
        
        if response.status_code == 200:
            return json.loads(response.json()['response'])
    except Exception as e:
        print(f"[!] AI Analysis Error: {e}")
    return None

def migrate_batch(limit=None):
    print(f"[*] AI Batch Migration Started: {SOURCE_ROOT} -> {TARGET_ROOT}")
    if limit:
        print(f"[*] PILOT MODE: Limited to {limit} files.")
    
    with open(PROMPT_FILE, 'r', encoding='utf-8') as f:
        prompt_template = f.read()

    # 모든 마크다운 파일 수집
    all_files = []
    for root, dirs, files in os.walk(SOURCE_ROOT):
        if 'Files' in root or 'notebooks' in root: continue # 첨부파일 및 중복 폴더 제외
        for file in files:
            if file.endswith(".md"):
                all_files.append(os.path.join(root, file))

    if limit:
        all_files = all_files[:limit]

    total = len(all_files)
    print(f"[*] Total files to process: {total}")

    success_count = 0
    skip_count = 0
    start_time = time.time()

    for i, source_path in enumerate(all_files):
        filename = normalize_nfc(os.path.basename(source_path))
        print(f"[{i+1}/{total}] Processing: {filename}...", end="\r")

        # 분석 및 마이그레이션 로직
        try:
            with open(source_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if not content.strip(): continue

            # AI 분석 호출
            ai_data = get_ai_analysis(content, prompt_template)
            if not ai_data:
                print(f"\n[!] AI failed for: {filename}")
                continue

            # 카테고리 정규화
            raw_folder = ai_data.get('suggested_folder', '00_Inbox')
            
            # 우선순위: 명시적 번호가 있는 경우 -> 키워드만 있는 경우
            # (?i) : case-insensitive, (?:...) : non-capturing group
            mapping_rules = [
                (r'^0?0_?(?:Inbox|인박스)', '00_Inbox'),
                (r'^0?1_?(?:Projects?|프로젝트)', '01_Projects'),
                (r'^0?2_?(?:Areas?|영역)', '02_Areas'),
                (r'^0?3_?(?:Resources?|자료)', '03_Resources'),
                (r'^0?4_?(?:Archives?|보관)|99_?Archive', '04_Archives'),
                # 번호 없이 키워드만 시작하는 경우
                (r'^Projects?', '01_Projects'),
                (r'^Areas?', '02_Areas'),
                (r'^Resources?', '03_Resources'),
                (r'^Archives?', '04_Archives'),
            ]
            
            suggested_folder = raw_folder
            for pattern, target in mapping_rules:
                if re.search(pattern, raw_folder, re.IGNORECASE):
                    # 매칭된 부분을 표준 이름으로 교체
                    # 주의: sub는 매칭된 '부분'만 바꿈. 
                    # 경로 전체를 보존하면서 앞부분만 바꾸기 위해 sub 사용
                    suggested_folder = re.sub(pattern, target, raw_folder, count=1, flags=re.IGNORECASE)
                    break
            
            # 만약 매칭되는 게 전혀 없다면 (단순 키워드가 중간에 있거나 앞에 번호가 없는 경우)
            if suggested_folder == raw_folder and not re.match(r'^\d+_', raw_folder):
                simple_keywords = [
                    ('Project', '01_Projects'),
                    ('Area', '02_Areas'),
                    ('Resource', '03_Resources'),
                    ('Archive', '04_Archives')
                ]
                for kw, target in simple_keywords:
                    # 키워드가 포함되어 있으면
                    if kw.lower() in raw_folder.lower():
                        # 이미 타겟 이름으로 시작하는지 확인 (예: 'Projects/...' -> '01_Projects/...')
                        pattern = r'^' + kw + r's?'
                        if re.search(pattern, raw_folder, re.IGNORECASE):
                            suggested_folder = re.sub(pattern, target, raw_folder, count=1, flags=re.IGNORECASE)
                        else:
                            # 중간에 키워드가 있는 경우 그냥 앞에 붙임 (단, 중복 방지)
                            if not raw_folder.startswith(target):
                                suggested_folder = target + "/" + raw_folder.lstrip("/")
                        break
            
            # 최종 보정: "02_Areas/02_Areas" 같은 형태가 생겼다면 하나로 병합
            # (AI가 가끔 카테고리명을 중복해서 뱉는 경우 방지)
            parts = suggested_folder.split('/')
            new_parts = []
            for p in parts:
                if not new_parts or p.lower() != new_parts[-1].lower():
                    # PARA 폴더명끼리의 중복도 체크 (01_Projects vs Projects)
                    is_duplicate = False
                    for _, standard in mapping_rules[:5]:
                        if p.lower() in standard.lower() and new_parts and new_parts[-1] == standard:
                            is_duplicate = True
                            break
                    if not is_duplicate:
                        new_parts.append(p)
            suggested_folder = "/".join(new_parts)
            
            # 최종 경로 설정
            target_dir = os.path.join(TARGET_ROOT, suggested_folder)
            os.makedirs(target_dir, exist_ok=True)
            target_path = os.path.join(target_dir, filename)

            # 중복 체크 (선택 사항: 원하시면 덮어쓰기 or 스킵)
            if os.path.exists(target_path):
                # print(f"\n[-] Skipping (Already exists): {filename}")
                skip_count += 1
                continue

            # 내용 변환 (태그 정제 + 이미지 경로 + YAML)
            cleaned_content = clean_inline_hashtags(content)
            final_content = fix_image_paths(cleaned_content, suggested_folder)
            
            frontmatter = ai_data.get('yaml_frontmatter', '---\n---\n')
            full_content = f"{frontmatter}\n\n{final_content}"

            with open(target_path, 'w', encoding='utf-8') as f:
                f.write(full_content)
            
            success_count += 1
            
        except Exception as e:
            print(f"\n[!] Error during processing {filename}: {e}")

    elapsed = time.time() - start_time
    print(f"\n\n[+] Migration Finished!")
    print(f"    - Total: {total}")
    print(f"    - Success: {success_count}")
    print(f"    - Skipped: {skip_count}")
    print(f"    - Time Elapsed: {elapsed:.2f}s (Avg: {elapsed/max(1, success_count):.2f}s/file)")

if __name__ == "__main__":
    # PILOT TEST: 10개만 먼저 진행해 봅니다.
    # 전체 마이그레이션 시에는 None으로 변경하거나 인자를 제거하세요.
    migrate_batch(limit=10)
