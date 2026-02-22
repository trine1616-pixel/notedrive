"use client";

import React, { useState, useTransition, useEffect } from 'react';
import type { Note } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Save, Maximize2, Minimize2, ChevronLeft, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { summarizeNoteAction, saveNoteAction } from '@/app/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { RichEditor } from './rich-editor';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreVertical, Trash2, Share2, Info, MoreHorizontal } from 'lucide-react';

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
  const [isSaving, startSavingTransition] = useTransition();
  const [summary, setSummary] = useState<string | null>(null);
  const [displayUpdatedAt, setDisplayUpdatedAt] = useState<string | null>(null);
  const { toast } = useToast();

  const extractHashtags = (markdown: string): string[] => {
    const matches = markdown.match(/#[\w\u00C0-\u00FF\uAC00-\uD7A3-]+/g) || [];
    return Array.from(new Set(matches.map((tag) => tag.substring(1).toLowerCase())));
  };

  useEffect(() => {
    setContent(note.content);
    setLiveHashtags(note.hashtags || []);
    const date = new Date(note.updatedAt);
    setDisplayUpdatedAt(Number.isNaN(date.getTime()) ? '--' : format(date, "PPP p"));
  }, [note]);

  const handleSave = () => {
    startSavingTransition(async () => {
      const result = await saveNoteAction({ noteId: note.id, content });
      if (!result.note) {
        toast({
          variant: 'destructive',
          title: 'Save failed',
          description: result.error || 'Could not save note.',
        });
        return;
      }

      onNoteUpdate(result.note);
    });
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
                  onClick={() => {
                    handleSave();
                    if (onBack) onBack();
                  }}
                  className="p-0 h-auto text-[16px] font-medium text-sky-600 hover:bg-transparent"
                >
                  완료
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground">
                  <Share2 className="h-[22px] w-[22px]" />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground">
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
              </div>
              <div className="flex gap-1.5 items-center">
                <Button onClick={handleSummarize} variant="outline" size="sm" disabled={isAiSummarizing}>
                  {isAiSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 text-amber-500" />}
                  AI Summarize
                </Button>
                <Button onClick={handleSave} size="sm" className="bg-sky-600 hover:bg-sky-700" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Note
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
    </>
  );
}
