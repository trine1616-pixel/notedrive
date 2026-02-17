import os
import time
import json
import requests
import shutil
import re
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Configuration
WATCH_DIR = "Obsidian_Vault/00_Inbox"
VAULT_ROOT = "Obsidian_Vault"
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "gemma3:12b"
PROMPT_FILE = "prompts/summarize_note.md"

# 허용된 태그 리스트
ALLOWED_TAGS = {'raw', 'code', 'distilled', 'final', 'vp', 'family', 'reference', 'checklist', 'it', 'distill', 'unreal', 'disguise'}

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

class NoteHandler(FileSystemEventHandler):
    def on_created(self, event):
        if not event.is_directory and event.src_path.endswith(".md"):
            self.process_note(event.src_path)

    def process_note(self, file_path):
        # AI 분석 파일은 다시 처리하지 않음 (이동 후 처리 방지)
        if VAULT_ROOT not in file_path: return
        
        print(f"[*] Processing note: {file_path}")
        time.sleep(1.5)  # 파일 쓰기 완료 대기
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if not content.strip(): return

            # 프롬프트 템플릿 읽기
            with open(PROMPT_FILE, 'r', encoding='utf-8') as f:
                prompt_template = f.read()
            
            prompt = prompt_template.replace("{{note_content}}", content)

            # Ollama 호출
            response = requests.post(OLLAMA_URL, json={
                "model": MODEL_NAME, "prompt": prompt, "format": "json", "stream": False
            })
            
            if response.status_code == 200:
                result = response.json()
                ai_data = json.loads(result['response'])
                
                # 1. 태그 정제 및 YAML 삽입
                cleaned_content = clean_inline_hashtags(content)
                new_frontmatter = ai_data.get('yaml_frontmatter', '---\n---\n')
                
                # 기존 Frontmatter가 있는지 확인 (매우 단순한 체크)
                if cleaned_content.startswith('---'):
                    # 기존 것 교체하거나 유지 (여기선 일단 상단에 추가)
                    final_content = f"{new_frontmatter}\n{cleaned_content}"
                else:
                    final_content = f"{new_frontmatter}\n\n{cleaned_content}"

                # 2. 파일 저장 (임시 저장 후 이동)
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(final_content)

                # 3. 자동 이동
                suggested_subfolder = ai_data.get('suggested_folder', '_InBox')
                target_dir = os.path.join(VAULT_ROOT, suggested_subfolder)
                
                if not os.path.exists(target_dir):
                    os.makedirs(target_dir)
                
                target_path = os.path.join(target_dir, os.path.basename(file_path))
                
                # 중복 방지
                base, ext = os.path.splitext(target_path)
                counter = 1
                while os.path.exists(target_path):
                    target_path = f"{base}_{counter}{ext}"
                    counter += 1
                
                shutil.move(file_path, target_path)
                print(f"[+] Success: {os.path.basename(file_path)} moved to {suggested_subfolder}")
                
            else:
                print(f"[!] Ollama Error: {response.status_code}")

        except Exception as e:
            print(f"[!] Critical Error: {e}")

if __name__ == "__main__":
    if not os.path.exists(WATCH_DIR):
        os.makedirs(WATCH_DIR)
        
    event_handler = NoteHandler()
    observer = Observer()
    observer.schedule(event_handler, WATCH_DIR, recursive=False)
    observer.start()
    
    print(f"[*] AI Note Guard started. Watching {WATCH_DIR}...")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
