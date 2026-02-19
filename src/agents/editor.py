import re

class EditorAgent:
    """
    Editor Agent (Cleanup Specialist):
    - Cleans up hashtags in text.
    - Fixes image paths relative to the folder depth.
    - Ensures consistent markdown formatting.
    """
    def __init__(self, allowed_tags=None):
        if allowed_tags is None:
            allowed_tags = {'raw', 'code', 'distilled', 'final', 'vp', 'family', 'reference', 'checklist', 'it', 'distill', 'unreal', 'disguise', 'driving'}
        self.allowed_tags = {tag.lower() for tag in allowed_tags}

    def clean_hashtags(self, content):
        """Escapes unknown hashtags to prevent tag clutter in Obsidian."""
        pattern = r'(?<!\w)#([a-zA-Z0-9_\uAC00-\uD7A3]+)'
        lines = content.split('\n')
        cleaned_lines = []
        for line in lines:
            # Skip headers
            if re.match(r'^#{1,6}\s', line):
                cleaned_lines.append(line)
                continue
            
            # Escape untrusted hashtags
            cleaned_line = re.sub(pattern, lambda m: m.group(0) if m.group(1).lower() in self.allowed_tags else f"\\#{m.group(1)}", line)
            cleaned_lines.append(cleaned_line)
        return '\n'.join(cleaned_lines)

    def fix_image_paths(self, content, target_folder_path):
        """Adjusts image paths relative to the current folder depth."""
        # depth calculation (e.g., '01_Projects/MyProject' -> depth 1, leading to '../Files/')
        depth = target_folder_path.strip('/').count('/')
        prefix = "../" * depth
        
        # Matches ![alt](Files/image.png)
        pattern = r'!\[(.*?)\]\(Files/(.*?)\)'
        replacement = f'![\\1]({prefix}Files/\\2)'
        return re.sub(pattern, replacement, content)

    def process_content(self, content, target_folder, ai_data):
        """Wraps all cleanup logic."""
        # 1. Base Cleanup
        content = self.clean_hashtags(content)
        content = self.fix_image_paths(content, target_folder)
        
        # 2. Add Frontmatter
        frontmatter = ai_data.get('yaml_frontmatter', '---\n---\n')
        full_content = f"{frontmatter}\n\n{content}"
        
        return full_content
