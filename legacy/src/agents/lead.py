import os
import json
import time
from datetime import datetime
from src.agents.librarian import LibrarianAgent
from src.agents.editor import EditorAgent
from src.agents.inspector import InspectorAgent

class LeadArchivist:
    """
    Lead Agent (Archivist):
    - Breaks down the migration task into sub-tasks.
    - Allocates notes to the Librarian (Classification) and Editor (Cleanup).
    - Manages the overall workflow and dependencies.
    - Logs activities to logs/ directory.
    """
    def __init__(self, inbox_path, vault_path, log_dir="logs"):
        self.inbox = inbox_path
        self.vault = vault_path
        self.log_dir = log_dir
        os.makedirs(log_dir, exist_ok=True)
        
        self.team = {
            "librarian": LibrarianAgent(),
            "editor": EditorAgent(),
            "inspector": InspectorAgent(target_root=vault_path)
        }
        
        # Initialize session log
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.session_log_path = os.path.join(log_dir, f"migration_{timestamp}.jsonl")

    def _log_event(self, event_type, data):
        """Append an event to the session log (JSONL format)."""
        event = {
            "timestamp": datetime.now().isoformat(),
            "type": event_type,
            **data
        }
        with open(self.session_log_path, 'a', encoding='utf-8') as f:
            f.write(json.dumps(event, ensure_ascii=False) + "\n")

    def analyze_inbox(self):
        """Scan 00_Inbox and identify notes for processing."""
        if not os.path.exists(self.inbox):
            print(f"[!] Lead: Inbox path {self.inbox} does not exist.")
            return []
            
        notes = [f for f in os.listdir(self.inbox) if f.endswith('.md')]
        print(f"[*] Lead: Found {len(notes)} notes in {self.inbox}")
        return sorted(notes)

    def process_note(self, note_filename, dry_run=False):
        """Coordinate specialists to process a single note."""
        print(f"[*] Lead: Working on '{note_filename}'...")
        
        source_path = os.path.join(self.inbox, note_filename)
        start_time = time.time()
        
        try:
            with open(source_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if not content.strip():
                return False, "Empty file"

            # 1. Librarian: Analyze and Classify
            print(f"    - Librarian: Analyzing...")
            ai_data = self.team['librarian'].analyze_note(content)
            if not ai_data:
                return False, "AI analysis failed"
            
            target_folder = self.team['librarian'].get_standardized_path(ai_data.get('suggested_folder'))
            
            # 2. Editor: Clean up and Format
            print(f"    - Editor: Cleaning up (Folder: {target_folder})...")
            final_content = self.team['editor'].process_content(content, target_folder, ai_data)
            
            if dry_run:
                return True, {"target_folder": target_folder, "dry_run": True}

            # Write to Vault
            target_dir = os.path.join(self.vault, target_folder)
            os.makedirs(target_dir, exist_ok=True)
            target_path = os.path.join(target_dir, note_filename)
            
            with open(target_path, 'w', encoding='utf-8') as f:
                f.write(final_content)
            
            # 3. Inspector: Verify
            print(f"    - Inspector: Verifying...")
            report = self.team['inspector'].verify_migration(target_path, note_filename)
            
            processing_time = time.time() - start_time
            
            if report["exists"] and report["has_content"] and report["valid_folder"]:
                # Success! Remove from Inbox (Archiving for now)
                # archive_dir = os.path.join(self.inbox, "processed")
                # os.makedirs(archive_dir, exist_ok=True)
                # os.rename(source_path, os.path.join(archive_dir, note_filename))
                
                self._log_event("SUCCESS", {
                    "filename": note_filename,
                    "target": target_folder,
                    "time": round(processing_time, 2),
                    "inspector_report": report
                })
                return True, report
            else:
                self._log_event("WARNING", {
                    "filename": note_filename,
                    "target": target_folder,
                    "error": "Inspector check failed",
                    "report": report
                })
                return False, report
                
        except Exception as e:
            self._log_event("ERROR", {
                "filename": note_filename,
                "error": str(e)
            })
            return False, str(e)

    def process_batch(self, limit=None):
        """Run the migration for all notes in the inbox."""
        notes = self.analyze_inbox()
        if limit:
            notes = notes[:limit]
            print(f"[*] Lead: Limit set to {limit} notes.")

        total = len(notes)
        success = 0
        failed = 0
        
        print(f"[*] Starting Batch Migration of {total} notes...")
        
        for i, note in enumerate(notes):
            print(f"\n[{i+1}/{total}]")
            ok, info = self.process_note(note)
            if ok:
                success += 1
            else:
                failed += 1
                print(f"[!] Lead: Failed {note} - {info}")

        print(f"\n[+] Batch Finished!")
        print(f"    - Success: {success}")
        print(f"    - Failed: {failed}")
        print(f"    - Log file: {self.session_log_path}")

if __name__ == "__main__":
    # Example usage
    lead = LeadArchivist("00_Inbox", "Obsidian_Vault")
    lead.process_batch(limit=2)
