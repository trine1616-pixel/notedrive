"use client";

import React, { useState, useMemo, useTransition, useEffect } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { NoteEditor } from '@/components/note-editor';
import { UserNav } from '@/components/user-nav';
import { Logo } from '@/components/logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, HardDrive, FolderPlus, RotateCcw, Trash2, FolderOpen, MoreHorizontal } from 'lucide-react';
import { DashboardProps, Note, Folder, ROOT_FOLDER_ID, TrashFolder, TrashNote } from '@/lib/types';
import FolderTree from './folder-tree';
import { NoteList } from './note-list';
import { TagList } from './tag-list';
import {
  createFolderAction,
  createNoteAction,
  deleteFolderAction,
  deleteNoteAction,
  moveFolderAction,
  moveNoteAction,
  permanentlyDeleteTrashFolderAction,
  permanentlyDeleteTrashNoteAction,
  renameFolderAction,
  renameNoteAction,
  restoreTrashFolderAction,
  restoreTrashNoteAction,
  setFolderColorAction,
  setFolderColorsAction,
} from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

type ContextMenuState = {
  x: number;
  y: number;
  type: 'note' | 'folder';
  id: string;
} | null;

const FOLDER_COLORS = ['#0ea5e9', '#22c55e', '#f97316', '#ef4444', '#a855f7', '#eab308'];

function MobileBottomNav({
  onSearchClick,
  onCreateNote,
  onCreateFolder,
  onMoveNote,
  onDeleteNote,
  hasSelectedNote,
}: {
  onSearchClick: () => void;
  onCreateNote: () => void;
  onCreateFolder: () => void;
  onMoveNote?: () => void;
  onDeleteNote?: () => void;
  hasSelectedNote: boolean;
}) {
  const { setOpenMobile } = useSidebar();

  return (
    <div className="flex-shrink-0 flex items-center justify-around border-t border-border/50 bg-background p-2 pb-safe">
      <Button variant="ghost" className="flex flex-col items-center justify-center gap-1 h-auto py-2 px-6 rounded-xl hover:bg-accent/50 text-muted-foreground hover:text-foreground" onClick={() => {
        setOpenMobile(true);
        setTimeout(() => document.getElementById('sidebar-search-input')?.focus(), 150);
      }}>
        <Search className="h-[22px] w-[22px]" />
        <span className="text-[10px] font-medium">Search</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex flex-col items-center justify-center gap-1 h-auto py-2 px-6 rounded-xl hover:bg-accent/50 text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="h-[22px] w-[22px]" />
            <span className="text-[10px] font-medium">More</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 mb-2 rounded-xl shadow-lg border-border/50">
          <DropdownMenuItem onClick={onCreateNote} className="py-2.5">
            <Plus className="h-4 w-4 mr-2" />
            <span className="flex-1">New Note</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onCreateFolder} className="py-2.5">
            <FolderPlus className="h-4 w-4 mr-2" />
            <span className="flex-1">New Folder</span>
          </DropdownMenuItem>
          {hasSelectedNote && (
            <>
              <DropdownMenuSeparator className="my-1" />
              {onMoveNote && (
                <DropdownMenuItem onClick={onMoveNote} className="py-2.5">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  <span className="flex-1">Move Note</span>
                </DropdownMenuItem>
              )}
              {onDeleteNote && (
                <DropdownMenuItem onClick={onDeleteNote} className="py-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span className="flex-1">Delete Note</span>
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function Dashboard({
  initialNotes,
  initialFolders,
  initialTrashNotes,
  initialTrashFolders,
  storageProvider,
}: DashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [trashNotes, setTrashNotes] = useState<TrashNote[]>(initialTrashNotes);
  const [trashFolders, setTrashFolders] = useState<TrashFolder[]>(initialTrashFolders);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(initialNotes[0]?.id || null);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set(initialNotes[0]?.id ? [initialNotes[0].id] : []));
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isTrashView, setIsTrashView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editorOnlyMode, setEditorOnlyMode] = useState(false);
  const [isCreatingNote, startCreateTransition] = useTransition();
  const [isMoving, startMoveTransition] = useTransition();
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [pane1Width, setPane1Width] = useState(320);
  const [pane2Width, setPane2Width] = useState(420);
  const [isResizingPane1, setIsResizingPane1] = useState(false);
  const [isResizingPane2, setIsResizingPane2] = useState(false);
  const [activeMobileView, setActiveMobileView] = useState<'list' | 'editor'>('list');
  const { isMobile } = useIsMobile();
  const { toast } = useToast();
  const effectivePane1Width = sidebarOpen ? pane1Width : 0;

  const childMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const folder of folders) {
      const parent = folder.parentId || ROOT_FOLDER_ID;
      if (!map.has(parent)) map.set(parent, []);
      map.get(parent)!.push(folder.id);
    }
    return map;
  }, [folders]);

  const descendantsByFolder = useMemo(() => {
    const collect = (folderId: string): string[] => {
      const childIds = childMap.get(folderId) || [];
      return childIds.flatMap(id => [id, ...collect(id)]);
    };

    const map = new Map<string, string[]>();
    for (const folder of folders) {
      map.set(folder.id, collect(folder.id));
    }
    return map;
  }, [folders, childMap]);

  const getFolderTotalNoteCount = (folderId: string) => {
    const descendantSet = new Set([folderId, ...(descendantsByFolder.get(folderId) || [])]);
    return notes.filter(note => descendantSet.has(note.folderId)).length;
  };

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(note => note.hashtags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [notes]);

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const note of notes) {
      for (const tag of note.hashtags) {
        counts[tag] = (counts[tag] || 0) + 1;
      }
    }
    return counts;
  }, [notes]);

  const filteredNotesByList = useMemo(() => {
    if (isTrashView) {
      return [];
    }
    if (searchQuery) {
      return notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.hashtags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedFolderId) {
      const descendantSet = new Set([selectedFolderId, ...(descendantsByFolder.get(selectedFolderId) || [])]);
      return notes.filter(note => descendantSet.has(note.folderId));
    }

    if (selectedTag) {
      return notes.filter(note => note.hashtags.includes(selectedTag));
    }

    return notes;
  }, [notes, selectedFolderId, selectedTag, searchQuery, descendantsByFolder, isTrashView]);

  const childFoldersForList = useMemo(() => {
    if (!selectedFolderId || isTrashView) return [];
    return folders.filter(folder => folder.parentId === selectedFolderId);
  }, [folders, selectedFolderId, isTrashView]);

  const selectedNote = useMemo(() => notes.find(note => note.id === selectedNoteId), [notes, selectedNoteId]);

  useEffect(() => {
    if (notes.length === 0) {
      setSelectedNoteId(null);
      setSelectedNoteIds(new Set());
      return;
    }

    if (!selectedNoteId || !notes.some((note) => note.id === selectedNoteId)) {
      setSelectedNoteId(notes[0].id);
      setSelectedNoteIds(new Set([notes[0].id]));
    }
  }, [notes, selectedNoteId]);

  useEffect(() => {
    if (editorOnlyMode && !selectedNote) {
      setEditorOnlyMode(false);
    }
  }, [editorOnlyMode, selectedNote]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setEditorOnlyMode(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!isResizingPane1 && !isResizingPane2) return;

    const onMove = (event: MouseEvent) => {
      if (isResizingPane1) {
        const nextPane1 = Math.max(240, Math.min(640, event.clientX));
        setPane1Width(nextPane1);
      }
      if (isResizingPane2) {
        const nextPane2 = Math.max(260, Math.min(760, event.clientX - effectivePane1Width));
        setPane2Width(nextPane2);
      }
    };

    const onUp = () => {
      setIsResizingPane1(false);
      setIsResizingPane2(false);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isResizingPane1, isResizingPane2, effectivePane1Width]);

  const applyDataRefresh = (
    payload: { notes?: Note[]; folders?: Folder[]; trashNotes?: TrashNote[]; trashFolders?: TrashFolder[]; error?: string },
    failMessage: string
  ) => {
    if (!payload.notes || !payload.folders || !payload.trashNotes || !payload.trashFolders) {
      toast({ variant: 'destructive', title: 'Action failed', description: payload.error || failMessage });
      return false;
    }

    setNotes(payload.notes);
    setFolders(payload.folders);
    setTrashNotes(payload.trashNotes);
    setTrashFolders(payload.trashFolders);
    return true;
  };

  const handleCreateNote = () => {
    const title = window.prompt('New note title', 'Untitled Note');
    if (!title) return;

    startCreateTransition(async () => {
      const result = await createNoteAction({ title, folderId: selectedFolderId || ROOT_FOLDER_ID });
      if (!result.note) {
        toast({ variant: 'destructive', title: 'Create failed', description: result.error || 'Could not create note.' });
        return;
      }

      const note = result.note;
      setNotes((prevNotes) => [note, ...prevNotes]);
      setSelectedNoteId(note.id);
      setSelectedNoteIds(new Set([note.id]));
      toast({ title: 'Note created', description: `"${note.title}" is ready to edit.` });
    });
  };

  const handleCreateFolder = () => {
    const name = window.prompt('New folder name', 'New Folder');
    if (!name) return;

    startCreateTransition(async () => {
      const result = await createFolderAction({ name, parentFolderId: selectedFolderId || ROOT_FOLDER_ID });
      if (!applyDataRefresh(result, 'Could not create folder.')) return;
      toast({ title: 'Folder created', description: `"${name}" has been created.` });
    });
  };

  const handleMoveNote = (noteId: string, targetFolderId: string) => {
    startMoveTransition(async () => {
      const result = await moveNoteAction({ noteId, targetFolderId });
      if (!applyDataRefresh(result, 'Could not move note.')) return;
      if (result.movedNoteId) {
        setSelectedNoteId(result.movedNoteId);
      }
      toast({ title: 'Note moved', description: 'Moved to selected folder.' });
    });
  };

  const handleMoveFolder = (folderId: string, targetParentFolderId: string) => {
    startMoveTransition(async () => {
      const result = await moveFolderAction({ folderId, targetParentFolderId });
      if (!applyDataRefresh(result, 'Could not move folder.')) return;
      if (selectedFolderId === folderId) {
        setSelectedFolderId(result.movedFolderId || null);
      }
      toast({ title: 'Folder moved', description: 'Folder location updated.' });
    });
  };

  const handleFolderSelect = (folderId: string | null, event?: React.MouseEvent) => {
    if (folderId === null) {
      setSelectedFolderId(null);
      setSelectedFolderIds(new Set());
      setSelectedTag(null);
      setIsTrashView(false);
      return;
    }

    if (event && (event.metaKey || event.ctrlKey)) {
      const next = new Set(selectedFolderIds);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      setSelectedFolderIds(next);
      setSelectedFolderId(folderId);
      setSelectedTag(null);
      setIsTrashView(false);
      return;
    }

    setSelectedFolderId(folderId);
    setSelectedFolderIds(new Set([folderId]));
    setSelectedTag(null);
    setIsTrashView(false);
    if (isMobile) {
      setActiveMobileView('list');
    }
  };

  const handleNoteSelect = (noteId: string, event?: React.MouseEvent) => {
    if (event && event.shiftKey && selectedNoteId) {
      const allIds = filteredNotesByList.map(note => note.id);
      const start = allIds.indexOf(selectedNoteId);
      const end = allIds.indexOf(noteId);
      if (start !== -1 && end !== -1) {
        const [min, max] = start < end ? [start, end] : [end, start];
        setSelectedNoteIds(new Set(allIds.slice(min, max + 1)));
        setSelectedNoteId(noteId);
        return;
      }
    }

    if (event && (event.metaKey || event.ctrlKey)) {
      const next = new Set(selectedNoteIds);
      if (next.has(noteId)) next.delete(noteId);
      else next.add(noteId);
      setSelectedNoteIds(next);
      setSelectedNoteId(noteId);
      return;
    }

    setSelectedNoteId(noteId);
    setSelectedNoteIds(new Set([noteId]));
    if (isMobile) {
      setActiveMobileView('editor');
    }
  };

  const handleNoteContextMenu = (event: React.MouseEvent, noteId: string) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, type: 'note', id: noteId });
  };

  const handleFolderContextMenu = (event: React.MouseEvent, folderId: string) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, type: 'folder', id: folderId });
  };

  const closeContextMenu = () => setContextMenu(null);

  const runRenameNote = async (noteId: string) => {
    const note = notes.find(item => item.id === noteId);
    if (!note) return;

    const newTitle = window.prompt('Rename note', note.title);
    if (!newTitle) return;

    const result = await renameNoteAction({ noteId, newTitle });
    if (!applyDataRefresh(result, 'Could not rename note.')) return;
    setSelectedNoteId(result.renamedNoteId || noteId);
    toast({ title: 'Renamed', description: 'Note renamed.' });
  };

  const runDeleteNote = async (noteId: string) => {
    const note = notes.find(item => item.id === noteId);
    if (!note) return;
    if (!window.confirm(`Delete note "${note.title}"?`)) return;

    const result = await deleteNoteAction({ noteId });
    if (!applyDataRefresh(result, 'Could not delete note.')) return;
    toast({ title: 'Moved to trash', description: 'Note moved to trash.' });
  };

  const runRenameFolder = async (folderId: string) => {
    const folder = folders.find(item => item.id === folderId);
    if (!folder) return;

    const newName = window.prompt('Rename folder', folder.name);
    if (!newName) return;

    const result = await renameFolderAction({ folderId, newName });
    if (!applyDataRefresh(result, 'Could not rename folder.')) return;

    if (selectedFolderId === folderId) {
      setSelectedFolderId(result.renamedFolderId || folderId);
    }
    toast({ title: 'Renamed', description: 'Folder renamed.' });
  };

  const runDeleteFolder = async (folderId: string) => {
    const folder = folders.find(item => item.id === folderId);
    if (!folder) return;
    if (!window.confirm(`Delete folder "${folder.name}" and all contents?`)) return;

    const result = await deleteFolderAction({ folderId });
    if (!applyDataRefresh(result, 'Could not delete folder.')) return;

    if (selectedFolderId === folderId) setSelectedFolderId(null);
    toast({ title: 'Moved to trash', description: 'Folder moved to trash.' });
  };

  const runCreateSubFolder = async (parentFolderId: string) => {
    const name = window.prompt('New subfolder name', 'New Folder');
    if (!name) return;

    const result = await createFolderAction({ name, parentFolderId });
    if (!applyDataRefresh(result, 'Could not create subfolder.')) return;
    toast({ title: 'Folder created', description: 'Subfolder created.' });
  };

  const runSetFolderColor = async (folderId: string, color: string) => {
    const targetIds = selectedFolderIds.has(folderId) && selectedFolderIds.size > 1
      ? Array.from(selectedFolderIds)
      : [folderId];
    const result = targetIds.length > 1
      ? await setFolderColorsAction({ folderIds: targetIds, color })
      : await setFolderColorAction({ folderId, color });
    if (!applyDataRefresh(result, 'Could not change folder color.')) return;
    toast({
      title: 'Color updated',
      description: targetIds.length > 1 ? `${targetIds.length} folders updated.` : 'Folder color changed.',
    });
  };

  const listTitle = useMemo(() => {
    if (isTrashView) return 'Trash';
    if (searchQuery) return `Search: "${searchQuery}"`;
    if (selectedTag) return `#${selectedTag}`;
    if (selectedFolderId) {
      const folder = folders.find(f => f.id === selectedFolderId);
      return folder ? `${folder.name} (with subfolders)` : 'Notes';
    }
    return 'All Notes';
  }, [searchQuery, selectedFolderId, selectedTag, folders, isTrashView]);

  const runRestoreTrashNote = async (trashNoteId: string) => {
    const result = await restoreTrashNoteAction({ trashNoteId });
    if (!applyDataRefresh(result, 'Could not restore note.')) return;
    toast({ title: 'Restored', description: 'Note restored from trash.' });
  };

  const runRestoreTrashFolder = async (trashFolderId: string) => {
    const result = await restoreTrashFolderAction({ trashFolderId });
    if (!applyDataRefresh(result, 'Could not restore folder.')) return;
    toast({ title: 'Restored', description: 'Folder restored from trash.' });
  };

  const runPermanentDeleteTrashNote = async (trashNoteId: string) => {
    if (!window.confirm('Permanently delete this note from trash?')) return;
    const result = await permanentlyDeleteTrashNoteAction({ trashNoteId });
    if (!applyDataRefresh(result, 'Could not permanently delete note.')) return;
    toast({ title: 'Deleted permanently', description: 'Trash note removed permanently.' });
  };

  const runPermanentDeleteTrashFolder = async (trashFolderId: string) => {
    if (!window.confirm('Permanently delete this folder from trash?')) return;
    const result = await permanentlyDeleteTrashFolderAction({ trashFolderId });
    if (!applyDataRefresh(result, 'Could not permanently delete folder.')) return;
    toast({ title: 'Deleted permanently', description: 'Trash folder removed permanently.' });
  };

  return (
    <SidebarProvider
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
      style={{ ['--sidebar-width' as any]: isMobile ? '100%' : `${pane1Width}px` }}
    >
      <div className="h-svh w-full overflow-hidden flex min-h-0" onClick={closeContextMenu}>
        {!editorOnlyMode && (
          <Sidebar collapsible="offcanvas">
            <SidebarRail />
            <SidebarHeader>
              <div className="flex items-center gap-2">
                <Logo />
                <div className="grow" />
                <SidebarTrigger />
              </div>
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="sidebar-search-input"
                    placeholder="Search all notes..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon" aria-label="New Note" onClick={handleCreateNote} disabled={isCreatingNote}>
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" aria-label="New Folder" onClick={handleCreateFolder} disabled={isCreatingNote}>
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 px-1 pt-1 text-xs text-muted-foreground">
                <HardDrive className="h-3.5 w-3.5" />
                <span>{storageProvider === 'gdrive' ? 'Google Drive storage' : 'Local folder storage'}</span>
              </div>
            </SidebarHeader>
            <SidebarContent className="p-2 space-y-4 overflow-y-auto">
              <div>
                <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Folders
                </h3>
                <FolderTree
                  folders={folders}
                  getFolderTotalNoteCount={getFolderTotalNoteCount}
                  onFolderSelect={handleFolderSelect}
                  onMoveNote={handleMoveNote}
                  onMoveFolder={handleMoveFolder}
                  onFolderContextMenu={handleFolderContextMenu}
                  selectedFolderId={selectedFolderId}
                  selectedFolderIds={selectedFolderIds}
                />
              </div>
              <TagList
                tags={allTags}
                tagCounts={tagCounts}
                selectedTag={selectedTag}
                isTrashSelected={isTrashView}
                trashCount={trashNotes.length + trashFolders.length}
                onTagSelect={(tag) => {
                  setSelectedTag(tag);
                  setSelectedFolderId(null);
                  setSelectedFolderIds(new Set());
                  setIsTrashView(false);
                }}
                onTrashSelect={() => {
                  setIsTrashView(true);
                  setSelectedTag(null);
                  setSelectedFolderId(null);
                  setSelectedFolderIds(new Set());
                }}
              />
            </SidebarContent>
            <SidebarFooter>
              <UserNav />
            </SidebarFooter>
          </Sidebar>
        )}
        {!editorOnlyMode && sidebarOpen && (
          <div
            className="w-1 cursor-col-resize bg-border/70 hover:bg-sky-400"
            onMouseDown={() => setIsResizingPane1(true)}
            aria-label="Resize folder pane"
          />
        )}

        <SidebarInset className="relative h-full min-h-0">
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {!editorOnlyMode && (
              <>
                <div
                  className={cn(
                    "flex-shrink-0 flex flex-col border-r h-full bg-muted/5 min-h-0",
                    isMobile && activeMobileView !== 'list' && "hidden",
                    isMobile && "w-full"
                  )}
                  style={{ width: isMobile ? '100%' : `${pane2Width}px` }}
                >
                  {isTrashView ? (
                    <div className="flex flex-col h-full border-r bg-muted/30 min-h-0">
                      <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
                        <h2 className="text-sm font-semibold truncate">Trash</h2>
                        <span className="text-xs text-muted-foreground">{trashNotes.length + trashFolders.length} items</span>
                      </div>
                      <div className="flex-1 min-h-0 overflow-y-auto">
                        {trashFolders.length > 0 && (
                          <div className="border-b">
                            <div className="px-3 py-2 text-[11px] text-muted-foreground uppercase">Folders</div>
                            {trashFolders.map((folder) => (
                              <div key={folder.id} className="px-3 py-2 border-b border-border/40">
                                <div className="text-sm truncate">{folder.name}</div>
                                <div className="mt-2 flex items-center gap-2">
                                  <Button size="sm" variant="outline" onClick={() => { void runRestoreTrashFolder(folder.id); }}>
                                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                                    Restore
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => { void runPermanentDeleteTrashFolder(folder.id); }}>
                                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {trashNotes.length > 0 && (
                          <div>
                            <div className="px-3 py-2 text-[11px] text-muted-foreground uppercase">Notes</div>
                            {trashNotes.map((note) => (
                              <div key={note.id} className="px-3 py-2 border-b border-border/40">
                                <div className="text-sm truncate">{note.title}</div>
                                <div className="mt-2 flex items-center gap-2">
                                  <Button size="sm" variant="outline" onClick={() => { void runRestoreTrashNote(note.id); }}>
                                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                                    Restore
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => { void runPermanentDeleteTrashNote(note.id); }}>
                                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {trashNotes.length === 0 && trashFolders.length === 0 && (
                          <div className="p-8 text-center text-sm text-muted-foreground">Trash is empty.</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <NoteList
                      notes={filteredNotesByList}
                      childFolders={childFoldersForList}
                      getFolderTotalNoteCount={getFolderTotalNoteCount}
                      selectedNoteId={selectedNoteId}
                      selectedNoteIds={selectedNoteIds}
                      onNoteSelect={handleNoteSelect}
                      onFolderSelect={(id) => handleFolderSelect(id)}
                      onNoteContextMenu={handleNoteContextMenu}
                      title={listTitle}
                    />
                  )}
                </div>
                {!isMobile && (
                  <div
                    className="w-1 cursor-col-resize bg-border/60 hover:bg-sky-400"
                    onMouseDown={() => setIsResizingPane2(true)}
                  />
                )}
              </>
            )}

            <div className={cn(
              "flex-1 flex flex-col min-w-0 h-full overflow-hidden min-h-0",
              isMobile && activeMobileView !== 'editor' && "hidden"
            )}>
              {selectedNote && !isTrashView ? (
                <main className="flex-1 p-4 md:p-6 h-full flex flex-col overflow-hidden min-h-0">
                  <NoteEditor
                    key={selectedNote.id}
                    note={selectedNote}
                    suggestedTags={allTags}
                    onNoteUpdate={(updatedNote) => {
                      setNotes(prev => prev.map(note => note.id === updatedNote.id ? updatedNote : note));
                    }}
                    editorOnlyMode={editorOnlyMode}
                    onToggleEditorOnlyMode={() => setEditorOnlyMode(prev => !prev)}
                    isMobile={isMobile}
                    onBack={() => setActiveMobileView('list')}
                  />
                </main>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground bg-background">
                  <div className="text-center space-y-3">
                    <p>Select a note from the list.</p>
                    {editorOnlyMode && (
                      <Button variant="outline" size="sm" onClick={() => setEditorOnlyMode(false)}>
                        Back To 3-Pane
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {isMoving && (
            <div className="absolute bottom-4 right-4 text-xs rounded bg-sky-600 text-white px-3 py-1.5 shadow z-50">
              Moving...
            </div>
          )}

          {contextMenu && (
            <div
              className="fixed z-[100] min-w-44 rounded-md border bg-background shadow-md p-1"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onClick={(event) => event.stopPropagation()}
            >
              {contextMenu.type === 'note' ? (
                <>
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded" onClick={() => { closeContextMenu(); void runRenameNote(contextMenu.id); }}>
                    Rename
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded text-destructive" onClick={() => { closeContextMenu(); void runDeleteNote(contextMenu.id); }}>
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded" onClick={() => { closeContextMenu(); void runCreateSubFolder(contextMenu.id); }}>
                    New Subfolder
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded" onClick={() => { closeContextMenu(); void runRenameFolder(contextMenu.id); }}>
                    Rename
                  </button>
                  <div className="px-3 py-2">
                    <div className="text-xs text-muted-foreground mb-2">Folder Color</div>
                    <div className="flex gap-2">
                      {FOLDER_COLORS.map(color => (
                        <button
                          key={color}
                          className="h-5 w-5 rounded-full border"
                          style={{ backgroundColor: color }}
                          onClick={() => { closeContextMenu(); void runSetFolderColor(contextMenu.id, color); }}
                        />
                      ))}
                    </div>
                  </div>
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded text-destructive" onClick={() => { closeContextMenu(); void runDeleteFolder(contextMenu.id); }}>
                    Delete
                  </button>
                </>
              )}
            </div>
          )}

          {isMobile && !editorOnlyMode && (
            <>
              {activeMobileView === 'list' && (
                <Button
                  size="icon"
                  className="absolute bottom-20 right-5 h-[56px] w-[56px] rounded-full shadow-lg bg-sky-600 hover:bg-sky-700 text-white z-50 transition-transform active:scale-95"
                  onClick={handleCreateNote}
                  aria-label="New Note"
                >
                  <Plus className="h-6 w-6" />
                </Button>
              )}
              <MobileBottomNav
                onSearchClick={() => { }}
                onCreateNote={handleCreateNote}
                onCreateFolder={handleCreateFolder}
                onMoveNote={selectedNoteId ? () => {
                  const targetId = window.prompt('Enter target folder ID to move note (WIP interface)');
                  if (targetId) handleMoveNote(selectedNoteId, targetId);
                } : undefined}
                onDeleteNote={selectedNoteId ? () => runDeleteNote(selectedNoteId) : undefined}
                hasSelectedNote={!!selectedNoteId && activeMobileView === 'editor'}
              />
            </>
          )}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
