import os
import re
import shutil
import unicodedata

# Configuration
SOURCE_DIR = "ref_upnote/upnote_organized"
TARGET_ROOT = "Obsidian_Vault"
ALLOWED_TAGS = {
    'raw', 'code', 'distilled', 'final', 'vp', 'family', 
    'reference', 'checklist', 'it', 'distill', 'unreal', 'disguise'
}

def normalize_nfc(text):
    """맥의 NFD(자소분리)를 NFC(표준)로 변환합니다."""
    return unicodedata.normalize('NFC', text)

def clean_inline_hashtags(content):
    """문장 내 해시태그 정제 (허용 리스트 외 이스케이프)"""
    pattern = r'(?<!\w)#([a-zA-Z0-9_\uAC00-\uD7A3]+)'
    lines = content.split('\n')
    cleaned_lines = []
    
    for line in lines:
        if re.match(r'^#{1,6}\s', line): # 헤더 보호
            cleaned_lines.append(line)
            continue
        
        cleaned_line = re.sub(pattern, lambda m: m.group(0) if m.group(1).lower() in ALLOWED_TAGS else f"\\#{m.group(1)}", line)
        cleaned_lines.append(cleaned_line)
    return '\n'.join(cleaned_lines)

def fix_image_paths(content, current_depth):
    """
    이미지 경로를 폴더 깊이에 맞게 자동 조정합니다.
    Files/image.png -> ../Files/image.png (depth 1)
                   -> ../../Files/image.png (depth 2)
    """
    # depth 만큼 ../ 추가
    prefix = "../" * current_depth
    # ![caption](Files/...) 패턴 찾기
    pattern = r'!\[(.*?)\]\(Files/(.*?)\)'
    replacement = f'![\\1]({prefix}Files/\\2)'
    
    return re.sub(pattern, replacement, content)

def migrate():
    print(f"[*] Starting Batch Migration: {SOURCE_DIR} -> {TARGET_ROOT}")
    
    # 1. 대상 루트 폴더가 없으면 생성
    if not os.path.exists(TARGET_ROOT):
        os.makedirs(TARGET_ROOT)

    count = 0
    for root, dirs, files in os.walk(SOURCE_DIR):
        # 'Files' 폴더 자체는 이미 복사했으므로 건너뜀
        if 'Files' in root:
            continue
            
        for file in files:
            if not file.endswith('.md'):
                continue
            
            source_path = os.path.join(root, file)
            
            # 상대 경로 계산 (폴더 계층 구조 유지용)
            rel_path = os.path.relpath(root, SOURCE_DIR)
            
            # 자소 분리 해결 (NFC 변환)
            target_subfolder = normalize_nfc(rel_path)
            target_filename = normalize_nfc(file)
            
            target_dir = os.path.join(TARGET_ROOT, target_subfolder)
            if target_subfolder == ".": 
                target_dir = TARGET_ROOT

            if not os.path.exists(target_dir):
                os.makedirs(target_dir, exist_ok=True)
            
            target_path = os.path.join(target_dir, target_filename)
            
            # 현재 폴더 깊이 계산 (상대 경로 내 구분자 개수)
            depth = 0 if rel_path == "." else rel_path.count(os.path.sep) + 1
            
            try:
                with open(source_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 정제 및 변환
                content = clean_inline_hashtags(content)
                content = fix_image_paths(content, depth)
                
                # 파일 저장
                with open(target_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                count += 1
                if count % 20 == 0:
                    print(f"[*] Processed {count} files...")
                    
            except Exception as e:
                print(f"[!] Error processing {file}: {e}")

    print(f"[+] Migration Complete! Total {count} files processed.")

if __name__ == "__main__":
    migrate()
