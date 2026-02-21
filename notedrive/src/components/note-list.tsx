"use client";

import React from 'react';
import { Note, Folder } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { FolderOpen } from 'lucide-react';

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
}: NoteListProps) {
  const safeDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '--';
    }
    return format(date, "MMM d");
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
    <div className="flex flex-col h-full border-r bg-muted/30 min-h-0">
      <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
        <h2 className="text-sm font-semibold truncate">{title}</h2>
        <span className="text-xs text-muted-foreground">{notes.length} notes</span>
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
                  "w-full text-left p-4 hover:bg-accent/50 transition-colors focus:bg-accent focus:outline-none cursor-grab active:cursor-grabbing",
                  selectedNoteId === note.id && "bg-accent",
                  selectedNoteIds.has(note.id) && "bg-accent/60"
                )}
              >
                <h3 className="text-sm font-medium truncate mb-1">{note.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {(note.content || '').substring(0, 120).replace(/[#*_~`]/g, '')}
                </p>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] text-muted-foreground uppercase whitespace-nowrap">
                    {safeDate(note.updatedAt)}
                  </span>
                  {note.hashtags.length > 0 && (
                    <span className="text-[10px] text-primary truncate max-w-[140px]">
                      #{note.hashtags[0]}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
