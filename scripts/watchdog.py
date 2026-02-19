import time
import sys
import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from src.agents.lead import LeadArchivist

class InboxHandler(FileSystemEventHandler):
    def __init__(self, lead):
        self.lead = lead

    def on_created(self, event):
        if not event.is_directory and event.src_path.endswith(".md"):
            filename = os.path.basename(event.src_path)
            print(f"\n[!] Watchdog: New note detected - {filename}")
            # Wait a bit to ensure file is fully written
            time.sleep(1)
            self.lead.process_note(filename)

    def on_moved(self, event):
        if not event.is_directory and event.dest_path.endswith(".md"):
            filename = os.path.basename(event.dest_path)
            print(f"\n[!] Watchdog: Note moved into inbox - {filename}")
            time.sleep(1)
            self.lead.process_note(filename)

def run_watchdog(inbox="00_Inbox", vault="Obsidian_Vault"):
    lead = LeadArchivist(inbox, vault)
    event_handler = InboxHandler(lead)
    observer = Observer()
    observer.schedule(event_handler, inbox, recursive=False)
    
    print(f"[*] Agent Team Watchdog started on '{inbox}'...")
    print("[*] Press Ctrl+C to stop.")
    
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

if __name__ == "__main__":
    run_watchdog()
