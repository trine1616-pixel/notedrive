"use client";

import React from 'react';
import { Folder, ChevronRight, Inbox } from 'lucide-react';
import type { Folder as FolderType } from '@/lib/types';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { ROOT_FOLDER_ID } from '@/lib/types';

type FolderTreeProps = {
  folders: FolderType[];
  getFolderTotalNoteCount: (folderId: string) => number;
  onFolderSelect: (folderId: string | null, event?: React.MouseEvent) => void;
  onMoveNote: (noteId: string, targetFolderId: string) => void;
  onMoveFolder: (folderId: string, targetParentFolderId: string) => void;
  onFolderContextMenu: (event: React.MouseEvent, folderId: string) => void;
  selectedFolderId: string | null;
  selectedFolderIds: Set<string>;
};

type FolderWithChildren = FolderType & {
  children: FolderWithChildren[];
};

const buildTree = (folders: FolderType[]): FolderWithChildren[] => {
  const folderMap = new Map<string, FolderWithChildren>();
  const tree: FolderWithChildren[] = [];

  folders.forEach(folder => {
    folderMap.set(folder.id, { ...folder, children: [] });
  });

  folders.forEach(folder => {
    if (folder.parentId && folderMap.has(folder.parentId)) {
      const parent = folderMap.get(folder.parentId);
      if (parent) {
        parent.children.push(folderMap.get(folder.id)!);
      }
    } else {
      tree.push(folderMap.get(folder.id)!);
    }
  });

  return tree;
};

function FolderItem({
  folder,
  expanded,
  toggleExpanded,
  getFolderTotalNoteCount,
  onFolderSelect,
  onMoveNote,
  onMoveFolder,
  onFolderContextMenu,
  selectedFolderId,
  selectedFolderIds,
  level,
}: {
  folder: FolderWithChildren;
  expanded: Record<string, boolean>;
  toggleExpanded: (folderId: string) => void;
  getFolderTotalNoteCount: (folderId: string) => number;
  onFolderSelect: (folderId: string | null, event?: React.MouseEvent) => void;
  onMoveNote: (noteId: string, targetFolderId: string) => void;
  onMoveFolder: (folderId: string, targetParentFolderId: string) => void;
  onFolderContextMenu: (event: React.MouseEvent, folderId: string) => void;
  selectedFolderId: string | null;
  selectedFolderIds: Set<string>;
  level: number;
}) {
  const totalNotes = getFolderTotalNoteCount(folder.id);
  const isSelected = selectedFolderId === folder.id;
  const isMultiSelected = selectedFolderIds.has(folder.id);
  const [isDropTarget, setIsDropTarget] = React.useState(false);

  const isOpen = expanded[folder.id] ?? true;

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDropTarget(false);

    const noteIdsRaw = event.dataTransfer.getData('application/x-notedrive-note-ids');
    const folderIdsRaw = event.dataTransfer.getData('application/x-notedrive-folder-ids');
    const noteId = event.dataTransfer.getData('application/x-notedrive-note');
    const folderId = event.dataTransfer.getData('application/x-notedrive-folder');

    const noteIds = noteIdsRaw ? JSON.parse(noteIdsRaw) as string[] : (noteId ? [noteId] : []);
    const folderIds = folderIdsRaw ? JSON.parse(folderIdsRaw) as string[] : (folderId ? [folderId] : []);

    noteIds.forEach((id) => onMoveNote(id, folder.id));
    folderIds.filter((id) => id !== folder.id).forEach((id) => onMoveFolder(id, folder.id));
  };

  return (
    <div className="space-y-1">
      <div
        className={cn('flex items-center gap-1 rounded-md', isDropTarget && 'ring-1 ring-sky-500 bg-sky-50')}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsDropTarget(true);
        }}
        onDragLeave={() => setIsDropTarget(false)}
        onDrop={handleDrop}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 p-0"
          onClick={() => toggleExpanded(folder.id)}
          aria-label={isOpen ? 'Collapse folder' : 'Expand folder'}
        >
          <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')} />
        </Button>

        <Button
          variant="ghost"
          draggable
          onDragStart={(event) => {
            const dragIds = selectedFolderIds.has(folder.id)
              ? Array.from(selectedFolderIds)
              : [folder.id];
            event.dataTransfer.setData('application/x-notedrive-folder', folder.id);
            event.dataTransfer.setData('application/x-notedrive-folder-ids', JSON.stringify(dragIds));
            event.dataTransfer.effectAllowed = 'move';
          }}
          onContextMenu={(event) => onFolderContextMenu(event, folder.id)}
          className={cn(
            'w-full justify-start h-9 pr-2 border',
            isSelected && 'bg-accent text-accent-foreground',
            isMultiSelected && 'bg-accent/60'
          )}
          onClick={(event) => onFolderSelect(folder.id, event)}
          style={{
            paddingLeft: `${4 + level * 12}px`,
            borderColor: `${folder.color || '#0ea5e9'}55`,
            backgroundColor: isSelected || isMultiSelected ? undefined : `${folder.color || '#0ea5e9'}14`,
          }}
        >
          <Folder className="h-4 w-4 mr-2" style={{ color: folder.color || '#0ea5e9' }} />
          <span className="font-medium text-sm truncate">{folder.name}</span>
          <span className="text-[10px] text-muted-foreground ml-2">{totalNotes}</span>
        </Button>
      </div>

      {isOpen && folder.children.length > 0 && (
        <div className="space-y-1 ml-3 pl-2 border-l border-border/70">
          {folder.children.map(child => (
            <FolderItem
              key={child.id}
              folder={child}
              expanded={expanded}
              toggleExpanded={toggleExpanded}
              getFolderTotalNoteCount={getFolderTotalNoteCount}
              onFolderSelect={onFolderSelect}
              onMoveNote={onMoveNote}
              onMoveFolder={onMoveFolder}
              onFolderContextMenu={onFolderContextMenu}
              selectedFolderId={selectedFolderId}
              selectedFolderIds={selectedFolderIds}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FolderTree({
  folders,
  getFolderTotalNoteCount,
  onFolderSelect,
  onMoveNote,
  onMoveFolder,
  onFolderContextMenu,
  selectedFolderId,
  selectedFolderIds,
}: FolderTreeProps) {
  const folderTree = React.useMemo(() => buildTree(folders), [folders]);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [isRootDropTarget, setIsRootDropTarget] = React.useState(false);

  React.useEffect(() => {
    setExpanded(prev => {
      const next = { ...prev };
      for (const folder of folders) {
        if (typeof next[folder.id] === 'undefined') {
          next[folder.id] = true;
        }
      }
      return next;
    });
  }, [folders]);

  const toggleExpanded = (folderId: string) => {
    setExpanded(prev => ({ ...prev, [folderId]: !(prev[folderId] ?? true) }));
  };

  const handleRootDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsRootDropTarget(false);

    const noteIdsRaw = event.dataTransfer.getData('application/x-notedrive-note-ids');
    const folderIdsRaw = event.dataTransfer.getData('application/x-notedrive-folder-ids');
    const noteId = event.dataTransfer.getData('application/x-notedrive-note');
    const folderId = event.dataTransfer.getData('application/x-notedrive-folder');

    const noteIds = noteIdsRaw ? JSON.parse(noteIdsRaw) as string[] : (noteId ? [noteId] : []);
    const folderIds = folderIdsRaw ? JSON.parse(folderIdsRaw) as string[] : (folderId ? [folderId] : []);

    noteIds.forEach((id) => onMoveNote(id, ROOT_FOLDER_ID));
    folderIds.forEach((id) => onMoveFolder(id, ROOT_FOLDER_ID));
  };

  return (
    <nav className="flex flex-col gap-1">
      <Button
        variant="ghost"
        className={cn(
          'w-full justify-start h-8 px-2',
          selectedFolderId === null && 'bg-accent text-accent-foreground',
          isRootDropTarget && 'ring-1 ring-sky-500 bg-sky-50'
        )}
        onClick={() => onFolderSelect(null)}
        onDragOver={(event) => {
          event.preventDefault();
          setIsRootDropTarget(true);
        }}
        onDragLeave={() => setIsRootDropTarget(false)}
        onDrop={handleRootDrop}
      >
        <Inbox className="h-4 w-4 mr-2 text-sky-500" />
        <span className="font-medium text-sm truncate">All Notes (Root)</span>
      </Button>

      {folderTree.map(folder => (
        <FolderItem
          key={folder.id}
          folder={folder}
          expanded={expanded}
          toggleExpanded={toggleExpanded}
          getFolderTotalNoteCount={getFolderTotalNoteCount}
          onFolderSelect={onFolderSelect}
          onMoveNote={onMoveNote}
          onMoveFolder={onMoveFolder}
          onFolderContextMenu={onFolderContextMenu}
          selectedFolderId={selectedFolderId}
          selectedFolderIds={selectedFolderIds}
          level={0}
        />
      ))}
    </nav>
  );
}
