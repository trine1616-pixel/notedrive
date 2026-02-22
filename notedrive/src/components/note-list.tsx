"use client";

import React from 'react';
import { Note, Folder } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { format } from 'date-fns';
import { FolderOpen, Menu } from 'lucide-react';

type NoteListProps = {
  notes: Note[];
  childFolders: Folder[];
  getFolderTotalNoteCount: (folderId: string) => number;
  selectedNoteId: string | null;
  selectedNoteIds: Set<string>;
  onNoteSelect: (id: string, event?: React.MouseEvent) => void;
  onFolderSelect: (id: string) => void;
  onNoteContextMenu: (event: React.MouseEvent, noteId: string) => void;
  title: string;
  onBackToFolders?: () => void;
};

export function NoteList({
  notes,
  childFolders,
  getFolderTotalNoteCount,
  selectedNoteId,
  selectedNoteIds,
  onNoteSelect,
  onFolderSelect,
  onNoteContextMenu,
  title,
  onBackToFolders,
}: NoteListProps) {
  const { isMobile, setOpenMobile } = useSidebar();

  const safeDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '--';
    }
    // Mobile format matches UpNote style: "2월 18, 오전 5:02" -> "MMM d, p"
    return format(date, "MMM d, p");
  };

  const handleNoteDragStart = (event: React.DragEvent<HTMLButtonElement>, noteId: string) => {
    const dragIds = selectedNoteIds.has(noteId)
      ? Array.from(selectedNoteIds)
      : [noteId];

    event.dataTransfer.setData('application/x-notedrive-note', noteId);
    event.dataTransfer.setData('application/x-notedrive-note-ids', JSON.stringify(dragIds));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="flex flex-col h-full bg-background min-h-0 relative">
      <div className={cn("p-4 border-b flex items-center flex-shrink-0 bg-background sticky top-0 z-10", isMobile ? "justify-center" : "justify-between")}>
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 h-10 w-10 text-sky-600 hover:bg-sky-50 transition-colors"
            onClick={() => setOpenMobile(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        )}
        <h2 className={cn("font-semibold truncate", isMobile ? "text-lg text-sky-600" : "text-sm")}>{title}</h2>
        {!isMobile && <span className="text-xs text-muted-foreground">{notes.length} notes</span>}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {childFolders.length > 0 && (
          <div className="border-b">
            <div className="px-3 py-2 text-[11px] text-muted-foreground uppercase">Subfolders</div>
            {childFolders.map((folder) => (
              <button
                key={folder.id}
                className="w-full text-left px-3 py-2 hover:bg-accent/50 text-sm flex items-center border-b border-border/40"
                onClick={() => onFolderSelect(folder.id)}
                style={{ backgroundColor: `${folder.color || '#0ea5e9'}12` }}
              >
                <FolderOpen className="h-4 w-4 mr-2" style={{ color: folder.color || '#0ea5e9' }} />
                <span className="truncate">{folder.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{getFolderTotalNoteCount(folder.id)}</span>
              </button>
            ))}
          </div>
        )}

        {notes.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No notes found.
          </div>
        ) : (
          <div className="divide-y">
            {notes.map(note => (
              <button
                key={note.id}
                onClick={(event) => onNoteSelect(note.id, event)}
                onContextMenu={(event) => onNoteContextMenu(event, note.id)}
                draggable
                onDragStart={(event) => handleNoteDragStart(event, note.id)}
                className={cn(
                  "w-full text-left p-4 hover:bg-accent/30 transition-colors focus:bg-accent/50 focus:outline-none cursor-grab active:cursor-grabbing",
                  selectedNoteId === note.id && "bg-accent/40",
                  selectedNoteIds.has(note.id) && "bg-accent/60"
                )}
              >
                <h3 className="text-[15px] font-medium text-foreground truncate mb-1.5">{note.title}</h3>
                <p className="text-sm text-muted-foreground truncate mb-2">
                  {(note.content || '').substring(0, 150).replace(/[#*_~`\n]/g, ' ')}
                </p>
                {note.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {note.hashtags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-sm text-muted-foreground">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-xs text-muted-foreground/80">
                  {safeDate(note.updatedAt)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
