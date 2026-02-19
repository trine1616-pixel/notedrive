import os
import json
import requests
import re
import unicodedata

class LibrarianAgent:
    """
    Librarian Agent (Classification Specialist):
    - Uses AI to analyze note content.
    - Normalizes PARA folder paths across the vault.
    - Ensures consistent categorization based on Skills.
    """
    def __init__(self, ollama_url="http://localhost:11434/api/generate", model="gemma3:12b"):
        self.ollama_url = ollama_url
        self.model = model
        self.prompt_template = self._load_prompt()

    def _load_prompt(self):
        prompt_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../prompts/summarize_note.md"))
        if os.path.exists(prompt_path):
            with open(prompt_path, 'r', encoding='utf-8') as f:
                return f.read()
        return "Analyze this note: {{note_content}}"

    def normalize_nfc(self, text):
        return unicodedata.normalize('NFC', text)

    def analyze_note(self, content):
        """Invoke AI to get classification data."""
        try:
            prompt = self.prompt_template.replace("{{note_content}}", content)
            response = requests.post(self.ollama_url, json={
                "model": self.model, "prompt": prompt, "format": "json", "stream": False
            }, timeout=60)
            
            if response.status_code == 200:
                return json.loads(response.json()['response'])
        except Exception as e:
            print(f"[!] Librarian Error: AI analysis failed - {e}")
        return None

    def get_standardized_path(self, ai_suggested_folder):
        """Normalize the AI suggested folder into standard PARA structure."""
        raw_folder = ai_suggested_folder or "00_Inbox"
        
        mapping_rules = [
            (r'^0?0_?(?:Inbox|인박스)', '00_Inbox'),
            (r'^0?1_?(?:Projects?|프로젝트)', '01_Projects'),
            (r'^0?2_?(?:Areas?|영역)', '02_Areas'),
            (r'^0?3_?(?:Resources?|자료)', '03_Resources'),
            (r'^0?4_?(?:Archives?|보관)|99_?Archive', '04_Archives'),
            (r'^Projects?', '01_Projects'),
            (r'^Areas?', '02_Areas'),
            (r'^Resources?', '03_Resources'),
            (r'^Archives?', '04_Archives'),
        ]
        
        suggested_folder = raw_folder
        for pattern, target in mapping_rules:
            if re.search(pattern, raw_folder, re.IGNORECASE):
                suggested_folder = re.sub(pattern, target, raw_folder, count=1, flags=re.IGNORECASE)
                break
        
        if suggested_folder == raw_folder and not re.match(r'^\d+_', raw_folder):
            simple_keywords = [
                ('Project', '01_Projects'),
                ('Area', '02_Areas'),
                ('Resource', '03_Resources'),
                ('Archive', '04_Archives')
            ]
            for kw, target in simple_keywords:
                if kw.lower() in raw_folder.lower():
                    pattern = r'^' + kw + r's?'
                    if re.search(pattern, raw_folder, re.IGNORECASE):
                        suggested_folder = re.sub(pattern, target, raw_folder, count=1, flags=re.IGNORECASE)
                    else:
                        if not raw_folder.startswith(target):
                            suggested_folder = target + "/" + raw_folder.lstrip("/")
                    break
        
        # Deduplicate nested PARA folders (e.g., 01_Projects/01_Projects)
        parts = suggested_folder.replace("\\", "/").split('/')
        new_parts = []
        for p in parts:
            p = p.strip()
            if not p: continue
            if not new_parts or p.lower() != new_parts[-1].lower():
                is_duplicate = False
                for _, standard in mapping_rules[:5]:
                    if p.lower() in standard.lower() and new_parts and new_parts[-1] == standard:
                        is_duplicate = True
                        break
                if not is_duplicate:
                    new_parts.append(p)
        
        return "/".join(new_parts)
