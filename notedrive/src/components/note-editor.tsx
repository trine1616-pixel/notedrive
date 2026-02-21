"use client";

import React, { useState, useTransition, useEffect } from 'react';
import type { Note } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Save, Maximize2, Minimize2, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { summarizeNoteAction, saveNoteAction } from '@/app/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { RichEditor } from './rich-editor';

type NoteEditorProps = {
  note: Note;
  onNoteUpdate: (note: Note) => void;
  editorOnlyMode: boolean;
  onToggleEditorOnlyMode: () => void;
  suggestedTags?: string[];
  isMobile?: boolean;
  onBack?: () => void;
};

export function NoteEditor({
  note,
  onNoteUpdate,
  editorOnlyMode,
  onToggleEditorOnlyMode,
  suggestedTags = [],
  isMobile = false,
  onBack
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
      toast({
        title: 'Note Saved!',
        description: `"${note.title}" has been updated.`,
      });
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
        <header className="flex-shrink-0 flex items-center justify-between pb-4 border-b mb-4 gap-2">
          <div className="flex items-center gap-2">
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 mr-2">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">Last updated</span>
              <span className="text-[10px] font-medium">{displayUpdatedAt}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button onClick={handleSummarize} variant="outline" size="sm" disabled={isAiSummarizing}>
              {isAiSummarizing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
              )}
              AI Summarize
            </Button>
            <Button onClick={handleSave} size="sm" className="bg-sky-600 hover:bg-sky-700" disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Note
            </Button>
            <Button onClick={onToggleEditorOnlyMode} variant="outline" size="sm">
              {editorOnlyMode ? <Minimize2 className="mr-2 h-4 w-4" /> : <Maximize2 className="mr-2 h-4 w-4" />}
              {editorOnlyMode ? 'Show Panels' : 'Editor Only'}
            </Button>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-hidden">
          <RichEditor
            title={note.title}
            content={content}
            suggestedTags={suggestedTags}
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

        <footer className="flex-shrink-0 pt-4 border-t mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Tags:</span>
            {liveHashtags.length > 0 ? liveHashtags.map(tag => (
              <Badge key={tag} variant="secondary" className="bg-sky-100 text-sky-800 hover:bg-sky-200 border-none">#{tag}</Badge>
            )) : <span className="text-xs text-muted-foreground italic">No tags</span>}
          </div>
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
