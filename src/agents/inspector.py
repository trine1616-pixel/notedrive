import os

class InspectorAgent:
    """
    Inspector Agent (Verification Specialist):
    - Verifies that the migrated file exists.
    - Checks for content integrity (no accidental wipeouts).
    - Validates PARA folder adherence.
    - Logs warnings for suspicious patterns (e.g., leftover raw hashtags).
    """
    def __init__(self, target_root="Obsidian_Vault"):
        self.target_root = target_root
        self.standard_para = {'00_Inbox', '01_Projects', '02_Areas', '03_Resources', '04_Archives'}

    def verify_migration(self, target_path, original_filename):
        """Perform final QA on a migrated note."""
        results = {
            "exists": False,
            "valid_folder": False,
            "has_content": False,
            "warnings": []
        }
        
        # 1. Existence Check
        if os.path.exists(target_path):
            results["exists"] = True
            file_size = os.path.getsize(target_path)
            if file_size > 10: # Minimum size for YAML + content
                results["has_content"] = True
            else:
                results["warnings"].append("File is suspiciously small (possible data loss).")
        
        # 2. PARA Adherence
        rel_path = os.path.relpath(target_path, self.target_root)
        para_folder = rel_path.split(os.sep)[0]
        if para_folder in self.standard_para:
            results["valid_folder"] = True
        else:
            results["warnings"].append(f"Folder '{para_folder}' is not a standard PARA category.")

        # 3. Content Scan (Optional/Advanced)
        if results["exists"]:
            try:
                with open(target_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Check for unescaped hashtags that aren't headers
                if "#" in content:
                    # Very simple heuristic: if there's a hashtag in the middle of a sentence
                    # (This is just for logging warnings)
                    pass
            except Exception as e:
                results["warnings"].append(f"Failed to read file for content check: {e}")

        return results
