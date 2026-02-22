"use client";

import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import { Markdown } from 'tiptap-markdown';
import React, { useEffect, useState, useCallback } from 'react';
import { uploadImageAction } from '@/app/upload-action';
import { useToast } from '@/hooks/use-toast';
import {
    Bold, Italic, List, ListOrdered, CheckSquare,
    Image as ImageIcon, Heading1, Heading2, Heading3,
    Paperclip, Undo2, Redo2, ChevronDown, Plus as PlusIcon, Divide
} from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { HashtagHighlight, getHashtagQuery } from './extensions/hashtag-extension';

import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface RichEditorProps {
    content: string;
    onChange: (markdown: string) => void;
    title: string;
    onTitleChange?: (newTitle: string) => void;
    suggestedTags?: string[];
    autoFocus?: boolean;
    isMobile?: boolean;
}

export function RichEditor({ content, onChange, title, onTitleChange, suggestedTags = [], autoFocus = false, isMobile = false }: RichEditorProps) {
    const { toast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const [tagQuery, setTagQuery] = useState<{ query: string; from: number; to: number } | null>(null);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
    const titleInputRef = React.useRef<HTMLInputElement | null>(null);

    const allTagSuggestions = React.useMemo(() => {
        const set = new Set<string>();
        suggestedTags.forEach((tag) => {
            if (tag && tag.trim()) set.add(tag.trim().toLowerCase());
        });
        return Array.from(set).sort();
    }, [suggestedTags]);

    const filteredSuggestions = React.useMemo(() => {
        if (!tagQuery) return [];
        const q = tagQuery.query.toLowerCase();
        const filtered = allTagSuggestions.filter((tag) => tag.startsWith(q));
        if (q && !filtered.includes(q)) {
            filtered.unshift(q);
        }
        return filtered.slice(0, 8);
    }, [allTagSuggestions, tagQuery]);

    useEffect(() => {
        setActiveSuggestionIndex(0);
    }, [tagQuery?.query]);

    const uploadAndInsertFile = async (file: File, editorInstance: any) => {
        const formData = new FormData();
        formData.append('file', file);
        const result = await uploadImageAction(formData);

        if (!result.success || !result.url) {
            toast({ variant: 'destructive', title: 'Upload Failed', description: result.error || 'Unknown upload error' });
            return;
        }

        if (file.type.startsWith('image/')) {
            editorInstance.chain().focus().setImage({ src: result.url }).run();
            return;
        }

        // Insert attachment as markdown link for non-image files.
        editorInstance.chain().focus().insertContent(`[${file.name}](${result.url})`).run();
    };

    const editor = useEditor({
        immediatelyRender: false,
        autofocus: autoFocus ? 'start' : false,
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Image.configure({
                allowBase64: true,
                HTMLAttributes: {
                    class: 'rounded-md shadow-sm max-w-full my-4',
                },
            }),
            Placeholder.configure({
                placeholder: ({ node }) => {
                    if (node.type.name === 'heading') {
                        return 'Heading...';
                    }
                    return "Type '/' for commands...";
                },
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Highlight,
            HashtagHighlight,
            Markdown,
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange((editor.storage as any).markdown.getMarkdown());
            setTagQuery(getHashtagQuery(editor));
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none min-h-[500px] max-w-none',
            },
            handleKeyDown: (_view, event) => {
                if (!tagQuery || filteredSuggestions.length === 0) return false;

                if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    setActiveSuggestionIndex((prev) => (prev + 1) % filteredSuggestions.length);
                    return true;
                }
                if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    setActiveSuggestionIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
                    return true;
                }
                if (event.key === 'Enter' || event.key === 'Tab') {
                    event.preventDefault();
                    const picked = filteredSuggestions[activeSuggestionIndex] || filteredSuggestions[0];
                    if (picked && editor) {
                        editor.chain().focus().insertContentAt({ from: tagQuery.from, to: tagQuery.to }, `#${picked} `).run();
                        setTagQuery(null);
                    }
                    return true;
                }
                if (event.key === 'Escape') {
                    event.preventDefault();
                    setTagQuery(null);
                    return true;
                }
                return false;
            },
            handleDrop: (view, event, slice, moved) => {
                if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
                    const file = event.dataTransfer.files[0];
                    const formData = new FormData();
                    formData.append('file', file);

                    uploadImageAction(formData).then(result => {
                        if (!result.success || !result.url) {
                            toast({ variant: 'destructive', title: 'Upload Failed', description: result.error || 'Unknown upload error' });
                            return;
                        }

                        if (file.type.startsWith('image/')) {
                            view.dispatch(view.state.tr.replaceSelectionWith(
                                view.state.schema.nodes.image.create({ src: result.url })
                            ));
                            return;
                        }

                        const linkText = `[${file.name}](${result.url})`;
                        view.dispatch(view.state.tr.insertText(linkText));
                    });
                    return true;
                }
                return false;
            },
        },
    });

    useEffect(() => {
        if (editor && content !== (editor.storage as any).markdown.getMarkdown()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    useEffect(() => {
        if (autoFocus && titleInputRef.current) {
            titleInputRef.current.focus();
        }
    }, [autoFocus]);

    if (!editor) return null;

    return (
        <div className={cn(
            "flex flex-col h-full bg-background overflow-hidden",
            !isMobile && "rounded-md border shadow-sm"
        )}>
            {/* Desktop Toolbar - hidden on mobile */}
            {!isMobile && (
                <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/20">
                    <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'bg-accent' : ''}>
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'bg-accent' : ''}>
                        <Italic className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="mx-1 h-6" />
                    <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}>
                        <Heading1 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}>
                        <Heading2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}>
                        <Heading3 className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="mx-1 h-6" />
                    <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'bg-accent' : ''}>
                        <List className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'bg-accent' : ''}>
                        <ListOrdered className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleTaskList().run()} className={editor.isActive('taskList') ? 'bg-accent' : ''}>
                        <CheckSquare className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="mx-1 h-6" />
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().chain().focus().undo().run()}
                    >
                        <Undo2 className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().chain().focus().redo().run()}
                    >
                        <Redo2 className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="mx-1 h-6" />
                    <Button size="sm" variant="ghost" onClick={() => fileInputRef.current?.click()}>
                        <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => fileInputRef.current?.click()}>
                        <Paperclip className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <div className="flex-1 overflow-auto p-4 md:p-8">
                <input
                    ref={titleInputRef}
                    className="w-full text-4xl font-bold mb-8 bg-transparent border-none outline-none placeholder:text-muted-foreground/30"
                    placeholder="Note Title"
                    value={title}
                    onChange={(e) => onTitleChange?.(e.target.value)}
                />
                <EditorContent editor={editor} />
                {tagQuery && filteredSuggestions.length > 0 && (
                    <div className="mt-3 w-full max-w-md rounded-md border bg-popover shadow-lg p-1">
                        {filteredSuggestions.map((tag, index) => (
                            <button
                                key={tag}
                                className={`w-full text-left px-3 py-1.5 text-sm rounded ${index === activeSuggestionIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}
                                onMouseDown={(event) => {
                                    event.preventDefault();
                                    editor.chain().focus().insertContentAt({ from: tagQuery.from, to: tagQuery.to }, `#${tag} `).run();
                                    setTagQuery(null);
                                }}
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Toolbar Placeholder / Slash Command status could be here */}
            {/* Mobile Keyboard Toolbar - only shown on mobile AND when focused */}
            {isMobile && editor.isFocused && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    className="flex-shrink-0 border-t bg-background/95 backdrop-blur-md sticky bottom-0 z-50 overflow-x-auto scrollbar-hide py-1 px-1"
                >
                    <div className="flex items-center gap-0 min-w-max">
                        <Button size="icon" variant="ghost" className="h-11 w-11 text-muted-foreground">
                            <PlusIcon className="h-5 w-5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-11 w-11 text-muted-foreground">
                            <Divide className="h-5 w-5 -rotate-45" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => editor.chain().focus().toggleTaskList().run()} className={cn("h-11 w-11", editor.isActive('taskList') ? 'text-sky-600 bg-sky-50' : 'text-muted-foreground')}>
                            <CheckSquare className="h-5 w-5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-11 w-11 text-muted-foreground" onClick={() => fileInputRef.current?.click()}>
                            <ImageIcon className="h-5 w-5" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={cn("h-11 w-11", editor.isActive('heading') ? 'text-sky-600 bg-sky-50' : 'text-muted-foreground')}>
                            <div className="flex items-baseline">
                                <span className="text-lg font-bold leading-none">H</span>
                            </div>
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-11 w-11 text-muted-foreground"
                            onClick={() => editor.chain().focus().undo().run()}
                            disabled={!editor.can().chain().focus().undo().run()}
                        >
                            <Undo2 className="h-5 w-5" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-11 w-11 text-muted-foreground"
                            onClick={() => editor.chain().focus().redo().run()}
                            disabled={!editor.can().chain().focus().redo().run()}
                        >
                            <Redo2 className="h-5 w-5" />
                        </Button>
                        <div className="w-px h-6 bg-border mx-1" />
                        <Button size="icon" variant="ghost" className="h-11 w-11 text-muted-foreground" onClick={() => {
                            editor.commands.blur();
                        }}>
                            <ChevronDown className="h-6 w-6" />
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* Minimal footer for mobile when not focused, or just less prominent */}
            <div className={cn(
                "p-1.5 border-t text-[9px] text-muted-foreground/50 flex justify-between bg-muted/5",
                isMobile && editor.isFocused && "hidden" // Hide footer when editing to save space
            )}>
                <span>Markdown Synced</span>
                <span>Words: {(editor.storage as any).markdown.getMarkdown().split(/\s+/).filter(Boolean).length}</span>
            </div>
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.txt,.md,.csv,.zip,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    await uploadAndInsertFile(file, editor);
                    event.target.value = '';
                }}
            />
        </div>
    );
}
