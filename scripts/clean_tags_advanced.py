import os
import re

# 허용된 태그 리스트 (Obsidian에서 태그로 유지할 것들)
ALLOWED_TAGS = {
    'raw', 'code', 'distilled', 'final', 'vp', 'family', 
    'reference', 'checklist', 'it', 'distill', 'unreal', 'disguise'
}

def clean_inline_hashtags(content):
    """
    문장 내의 해시태그를 정제합니다. 
    허용 리스트에 없는 해시태그는 \# 형태로 이스케이프 처리합니다.
    URL이나 코드 블록 내의 해시태그는 무시해야 하지만, 
    여기서는 가장 시급한 일반 텍스트 내 해시태그 위주로 처리합니다.
    """
    
    # 1. 태그 패턴 찾기: # 뒤에 한글, 영어, 숫자가 붙는 경우
    # [^#] 혹은 줄 시작(^) 뒤에 오는 #을 찾음
    # (?<!\w) 는 앞에 글자가 없을 때 (단어 경계)
    pattern = r'(?<!\w)#([a-zA-Z0-9_\uAC00-\uD7A3]+)'
    
    def replacer(match):
        tag_content = match.group(1).lower()
        full_match = match.group(0)
        
        # 허용된 태그인 경우 그대로 유지
        if tag_content in ALLOWED_TAGS:
            return full_match
        
        # Markdown 헤더 (# 제목) 인 경우 체크 (정규표현식 상으로는 걸리지 않겠지만 안전장치)
        # 만약 match 시작이 줄 시작이고 뒤에 공백이 있으면 헤더임
        
        # 그 외의 모든 '오염된' 태그는 이스케이프 처리
        return f"\\#{match.group(1)}"

    # 2. Markdown 헤더(줄 시작 # )를 임시로 보호하거나 정규표현식에서 제외
    # 여기서는 간단하게 문장 중간 및 단어 앞의 #만 처리하도록 pattern 개선
    
    lines = content.split('\n')
    cleaned_lines = []
    
    for line in lines:
        # Markdown 헤더(# , ## )는 건드리지 않음
        if re.match(r'^#{1,6}\s', line):
            cleaned_lines.append(line)
            continue
        
        # 줄 중간의 해시태그들 처리
        cleaned_line = re.sub(pattern, replacer, line)
        cleaned_lines.append(cleaned_line)
        
    return '\n'.join(cleaned_lines)

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    cleaned = clean_inline_hashtags(content)
    
    if content != cleaned:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(cleaned)
        return True
    return False

if __name__ == "__main__":
    # 검증을 위한 샘플 테스트용 코드
    sample_text = """
# 제목입니다
이것은 #test 입니다.
#raw 태그는 유지되어야 합니다.
하지만 #오염된태그 는 지워져야(이스케이프) 합니다.
URL: [링크](https://example.com/#heading) 무시해야 함.
    """
    print("--- Original ---")
    print(sample_text)
    print("--- Cleaned ---")
    print(clean_inline_hashtags(sample_text))
