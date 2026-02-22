"use client";

import React, { useState, useEffect, useTransition } from 'react';
import type { Note } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Maximize2, Minimize2, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { summarizeNoteAction, saveNoteAction } from '@/app/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { RichEditor } from './rich-editor';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Trash2, Share2, Info, MoreHorizontal, Link2 } from 'lucide-react';

type NoteEditorProps = {
  note: Note;
  onNoteUpdate: (note: Note) => void;
  editorOnlyMode: boolean;
  onToggleEditorOnlyMode: () => void;
  suggestedTags?: string[];
  isMobile?: boolean;
  onBack?: () => void;
  autoFocus?: boolean;
  folderPath?: string;
  onDeleteNote?: () => void;
};

export function NoteEditor({
  note,
  onNoteUpdate,
  editorOnlyMode,
  onToggleEditorOnlyMode,
  suggestedTags = [],
  isMobile = false,
  onBack,
  autoFocus = false,
  folderPath,
  onDeleteNote
}: NoteEditorProps) {
  const [content, setContent] = useState(note.content);
  const [liveHashtags, setLiveHashtags] = useState<string[]>(note.hashtags || []);
  const [isAiSummarizing, startAiTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [displayUpdatedAt, setDisplayUpdatedAt] = useState<string | null>(null);
  const [lastSavedContent, setLastSavedContent] = useState(note.content);
  const { toast } = useToast();

  const extractHashtags = (markdown: string): string[] => {
    const matches = markdown.match(/#[\w\u00C0-\u00FF\uAC00-\uD7A3-]+/g) || [];
    return Array.from(new Set(matches.map((tag) => tag.substring(1).toLowerCase())));
  };

  useEffect(() => {
    setContent(note.content);
    setLiveHashtags(note.hashtags || []);
    setLastSavedContent(note.content);
    const date = new Date(note.updatedAt);
    setDisplayUpdatedAt(Number.isNaN(date.getTime()) ? '--' : format(date, "PPP p"));
  }, [note]);

  const saveContent = React.useCallback(async (nextContent: string, options?: { silent?: boolean }) => {
    setIsSaving(true);
    try {
      const result = await saveNoteAction({ noteId: note.id, content: nextContent });
      if (!result.note) {
        if (!options?.silent) {
          toast({
            variant: 'destructive',
            title: 'Save failed',
            description: result.error || 'Could not save note.',
          });
        }
        return;
      }
      setLastSavedContent(result.note.content);
      onNoteUpdate(result.note);
    } finally {
      setIsSaving(false);
    }
  }, [note.id, onNoteUpdate, toast]);

  useEffect(() => {
    if (content === lastSavedContent) return;

    const timer = window.setTimeout(() => {
      void saveContent(content, { silent: true });
    }, 800);

    return () => window.clearTimeout(timer);
  }, [content, lastSavedContent, saveContent]);

  const handleDone = async () => {
    if (content !== lastSavedContent) {
      await saveContent(content);
    }
    onBack?.();
  };

  const handleSummarize = () => {
    startAiTransition(async () => {
      const result = await summarizeNoteAction({ noteContent: content });
      if (result.summary && !result.summary.startsWith('Error:')) {
        setSummary(result.summary);
      } else {
        toast({
          variant: 'destructive',
          title: 'Summarization Failed',
          description: result.summary || 'Could not generate a summary for this note.',
        });
      }
    });
  };

  const handleShare = async () => {
    const link = `${window.location.origin}/?note=${note.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: note.title || 'NoteDrive note',
          text: note.title || 'NoteDrive note',
          url: link,
        });
      } catch {
        // Ignore cancel actions.
      }
      return;
    }

    await navigator.clipboard.writeText(link);
    toast({ title: '링크 복사됨', description: '노트 링크를 클립보드에 복사했습니다.' });
  };

  return (
    <>
      <div className="flex-1 flex flex-col min-h-0 h-full">
        <header className={cn(
          "flex-shrink-0 flex items-center justify-between border-b gap-2",
          isMobile ? "py-1 px-3 h-11 mb-1" : "pb-4 mb-4"
        )}>
          {isMobile ? (
            <>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { void handleDone(); }}
                  className="p-0 h-auto text-[16px] font-medium text-sky-600 hover:bg-transparent"
                >
                  완료
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground" onClick={() => { void handleShare(); }}>
                  <Share2 className="h-[22px] w-[22px]" />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground" onClick={() => setShowInfo(true)}>
                  <Info className="h-[22px] w-[22px]" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground">
                      <MoreHorizontal className="h-[22px] w-[22px]" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleSummarize} disabled={isAiSummarizing}>
                      <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                      AI Summarize
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onToggleEditorOnlyMode}>
                      {editorOnlyMode ? <Minimize2 className="mr-2 h-4 w-4" /> : <Maximize2 className="mr-2 h-4 w-4" />}
                      {editorOnlyMode ? 'Show Panels' : 'Full Screen'}
                    </DropdownMenuItem>
                    {onDeleteNote && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onDeleteNote} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Note
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1 min-w-0">
                <div className="flex flex-col truncate">
                  {!isMobile && <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">Last updated</span>}
                  <span className="text-[10px] font-medium text-muted-foreground truncate">{displayUpdatedAt}</span>
                </div>
                <span className="text-[10px] text-muted-foreground/70 ml-2">
                  {isSaving ? '자동 저장 중...' : '자동 저장'}
                </span>
              </div>
              <div className="flex gap-1.5 items-center">
                <Button onClick={handleSummarize} variant="outline" size="sm" disabled={isAiSummarizing}>
                  {isAiSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 text-amber-500" />}
                  AI Summarize
                </Button>
                <Button onClick={onToggleEditorOnlyMode} variant="outline" size="sm">
                  {editorOnlyMode ? <Minimize2 className="mr-2 h-4 w-4" /> : <Maximize2 className="mr-2 h-4 w-4" />}
                  {editorOnlyMode ? 'Show Panels' : 'Editor Only'}
                </Button>
              </div>
            </>
          )}
        </header>

        <div className="flex-1 min-h-0 overflow-hidden">
          <RichEditor
            title={note.title}
            content={content}
            suggestedTags={suggestedTags}
            autoFocus={autoFocus}
            isMobile={isMobile}
            onTitleChange={(newTitle) => {
              onNoteUpdate({ ...note, title: newTitle });
            }}
            onChange={(nextMarkdown) => {
              setContent(nextMarkdown);
              const nextTags = extractHashtags(nextMarkdown);
              setLiveHashtags(nextTags);
              onNoteUpdate({
                ...note,
                content: nextMarkdown,
                hashtags: nextTags,
              });
            }}
          />
        </div>

        {/* Mobile footer is now integrated into NoteList or handled in RichEditor, 
            so we minimize it here to just show folder path when NOT editing */}
        <footer className={cn(
          "flex-shrink-0 border-t transition-all duration-300",
          isMobile ? "py-1.5 px-4 bg-muted/5 mt-auto" : "pt-4 mt-4"
        )}>
          {isMobile ? (
            <div className="flex items-center text-[10px] text-muted-foreground/60 gap-1">
              <FolderOpen className="h-3 w-3" />
              <span className="truncate">내용: {folderPath || 'All Notes'}</span>
              <span className="ml-auto opacity-50">{note.title}</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Tags:</span>
              {liveHashtags.length > 0 ? liveHashtags.map(tag => (
                <Badge key={tag} variant="secondary" className="bg-sky-100 text-sky-800 hover:bg-sky-200 border-none">#{tag}</Badge>
              )) : <span className="text-xs text-muted-foreground italic">No tags</span>}
            </div>
          )}
        </footer>
      </div>

      <Dialog open={!!summary} onOpenChange={(open) => !open && setSummary(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Summary</DialogTitle>
            <DialogDescription>
              Here is a summary of your note, generated by AI.
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm max-w-none text-muted-foreground bg-secondary/50 p-4 rounded-md">
            {summary}
          </div>
          <DialogFooter>
            <Button onClick={() => setSummary(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>노트 정보</DialogTitle>
            <DialogDescription>현재 노트의 기본 메타데이터입니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">제목</span>
              <span className="truncate text-right">{note.title || 'Untitled'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">폴더</span>
              <span className="truncate text-right">{folderPath || 'All Notes'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">해시태그</span>
              <span>{liveHashtags.length}개</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">단어 수</span>
              <span>{content.split(/\s+/).filter(Boolean).length}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { void handleShare(); }}>
              <Link2 className="mr-2 h-4 w-4" />
              링크 공유
            </Button>
            <Button onClick={() => setShowInfo(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
