"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { sinkListItem as pmSinkListItem } from "@tiptap/pm/schema-list";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Markdown } from "tiptap-markdown";
import React, { useEffect, useMemo, useState } from "react";
import { uploadImageAction } from "@/app/upload-action";
import { useToast } from "@/hooks/use-toast";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  CheckSquare,
  Pilcrow,
  Quote,
  Minus,
  Code2,
  CalendarDays,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  Paperclip,
  Undo2,
  Redo2,
  ChevronDown,
  ArrowRight,
  Palette,
} from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { HashtagHighlight, getHashtagQuery } from "./extensions/hashtag-extension";
import { FontSize } from "./extensions/font-size";
import {
  applyMarkdownShortcutOnEnter,
  applyMarkdownShortcutOnSpace,
} from "./extensions/markdown-shortcuts";
import {
  filterSlashCommands,
  getSlashQuery,
  runSlashCommand,
  type SlashQuery,
} from "./extensions/slash-command";
import {
  createEditorSlashCommands,
  EDITOR_COLOR_PALETTE,
} from "@/lib/editor-commands";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface RichEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  title: string;
  onTitleChange?: (newTitle: string) => void;
  suggestedTags?: string[];
  autoFocus?: boolean;
  isMobile?: boolean;
}

export function RichEditor({
  content,
  onChange,
  title,
  onTitleChange,
  suggestedTags = [],
  autoFocus = false,
  isMobile = false,
}: RichEditorProps) {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const titleInputRef = React.useRef<HTMLInputElement | null>(null);
  const isComposingRef = React.useRef(false);
  const lastSelectionRef = React.useRef<{ from: number; to: number } | null>(null);

  const [tagQuery, setTagQuery] = useState<{
    query: string;
    from: number;
    to: number;
  } | null>(null);
  const [slashQuery, setSlashQuery] = useState<SlashQuery | null>(null);
  const [slashMenuPosition, setSlashMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [activeTagSuggestionIndex, setActiveTagSuggestionIndex] = useState(0);
  const [activeSlashSuggestionIndex, setActiveSlashSuggestionIndex] = useState(0);
  const [mobileKeyboardOffset, setMobileKeyboardOffset] = useState(0);
  const [mobileColorPickerOpen, setMobileColorPickerOpen] = useState(false);

  const allTagSuggestions = useMemo(() => {
    const set = new Set<string>();
    suggestedTags.forEach((tag) => {
      if (tag && tag.trim()) set.add(tag.trim().toLowerCase());
    });
    return Array.from(set).sort();
  }, [suggestedTags]);

  const filteredTagSuggestions = useMemo(() => {
    if (!tagQuery) return [];
    const q = tagQuery.query.toLowerCase();
    const filtered = allTagSuggestions.filter((tag) => tag.startsWith(q));
    if (q && !filtered.includes(q)) {
      filtered.unshift(q);
    }
    return filtered.slice(0, 8);
  }, [allTagSuggestions, tagQuery]);

  const slashCommands = useMemo(() => createEditorSlashCommands(), []);

  const filteredSlashCommands = useMemo(() => {
    if (!slashQuery) return [];
    return filterSlashCommands(slashCommands, slashQuery.query);
  }, [slashCommands, slashQuery]);

  useEffect(() => {
    setActiveTagSuggestionIndex(0);
  }, [tagQuery?.query]);

  useEffect(() => {
    setActiveSlashSuggestionIndex(0);
  }, [slashQuery?.query]);

  useEffect(() => {
    if (!isMobile) return;
    if (typeof window === "undefined") return;

    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateOffset = () => {
      const keyboardHeight = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop
      );
      setMobileKeyboardOffset(keyboardHeight > 80 ? keyboardHeight : 0);
    };

    updateOffset();
    viewport.addEventListener("resize", updateOffset);
    viewport.addEventListener("scroll", updateOffset);
    window.addEventListener("resize", updateOffset);

    return () => {
      viewport.removeEventListener("resize", updateOffset);
      viewport.removeEventListener("scroll", updateOffset);
      window.removeEventListener("resize", updateOffset);
    };
  }, [isMobile]);

  const uploadAndInsertFile = async (file: File, editorInstance: Editor) => {
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadImageAction(formData);

    if (!result.success || !result.url) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: result.error || "Unknown upload error",
      });
      return;
    }

    if (file.type.startsWith("image/")) {
      editorInstance.chain().focus().setImage({ src: result.url }).run();
      return;
    }

    editorInstance
      .chain()
      .focus()
      .insertContent(`[${file.name}](${result.url})`)
      .run();
  };

  const syncInlineQueries = (editorInstance: Editor) => {
    const { from, to } = editorInstance.state.selection;
    lastSelectionRef.current = { from, to };

    const nextSlashQuery = getSlashQuery(editorInstance);
    setSlashQuery(nextSlashQuery);
    if (nextSlashQuery) {
      const coords = editorInstance.view.coordsAtPos(editorInstance.state.selection.from);
      const maxLeft = Math.max(16, window.innerWidth - 380);
      const maxTop = Math.max(16, window.innerHeight - 360);
      setSlashMenuPosition({
        top: Math.min(maxTop, coords.bottom + 8),
        left: Math.min(maxLeft, Math.max(16, coords.left - 12)),
      });
    } else {
      setSlashMenuPosition(null);
    }

    setTagQuery(getHashtagQuery(editorInstance));
  };

  const editor = useEditor({
    immediatelyRender: false,
    autofocus: autoFocus ? "start" : false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: "rounded-md shadow-sm max-w-full my-4",
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            return "Heading...";
          }
          return "Type '/' for commands...";
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Highlight,
      TextStyle,
      Color,
      FontSize,
      HashtagHighlight,
      Markdown,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange((editor.storage as any).markdown.getMarkdown());
      syncInlineQueries(editor);
    },
    onSelectionUpdate: ({ editor }) => {
      syncInlineQueries(editor);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none min-h-[500px] max-w-none [&_h1]:text-4xl [&_h1]:font-bold [&_h2]:text-3xl [&_h2]:font-semibold [&_h3]:text-2xl [&_h3]:font-semibold",
      },
      handleDOMEvents: {
        compositionstart: () => {
          isComposingRef.current = true;
          return false;
        },
        compositionend: () => {
          isComposingRef.current = false;
          return false;
        },
      },
      handleKeyDown: (_view, event) => {
        if (!editor) return false;

        if (event.isComposing || isComposingRef.current) {
          return false;
        }

        if (slashQuery && filteredSlashCommands.length > 0) {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveSlashSuggestionIndex(
              (prev) => (prev + 1) % filteredSlashCommands.length
            );
            return true;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveSlashSuggestionIndex(
              (prev) =>
                (prev - 1 + filteredSlashCommands.length) %
                filteredSlashCommands.length
            );
            return true;
          }
          if (event.key === "Enter" || event.key === "Tab") {
            event.preventDefault();
            const picked =
              filteredSlashCommands[activeSlashSuggestionIndex] ||
              filteredSlashCommands[0];
            if (picked) {
              runSlashCommand(editor, slashQuery, picked);
              setSlashQuery(null);
            }
            return true;
          }
          if (event.key === "Escape") {
            event.preventDefault();
            setSlashQuery(null);
            return true;
          }
        }

        if (tagQuery && filteredTagSuggestions.length > 0) {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveTagSuggestionIndex(
              (prev) => (prev + 1) % filteredTagSuggestions.length
            );
            return true;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveTagSuggestionIndex(
              (prev) =>
                (prev - 1 + filteredTagSuggestions.length) %
                filteredTagSuggestions.length
            );
            return true;
          }
          if (event.key === "Enter" || event.key === "Tab") {
            event.preventDefault();
            const picked =
              filteredTagSuggestions[activeTagSuggestionIndex] ||
              filteredTagSuggestions[0];
            if (picked) {
              editor
                .chain()
                .focus()
                .insertContentAt({ from: tagQuery.from, to: tagQuery.to }, `#${picked} `)
                .run();
              setTagQuery(null);
            }
            return true;
          }
          if (event.key === "Escape") {
            event.preventDefault();
            setTagQuery(null);
            return true;
          }
        }

        if (
          (event.key === " " || event.code === "Space") &&
          applyMarkdownShortcutOnSpace(editor)
        ) {
          event.preventDefault();
          syncInlineQueries(editor);
          return true;
        }

        if (
          event.key === "Enter" &&
          !event.shiftKey &&
          applyMarkdownShortcutOnEnter(editor)
        ) {
          event.preventDefault();
          syncInlineQueries(editor);
          return true;
        }

        return false;
      },
      handleDrop: (view, event, _slice, moved) => {
        if (
          !moved &&
          event.dataTransfer &&
          event.dataTransfer.files &&
          event.dataTransfer.files[0]
        ) {
          const file = event.dataTransfer.files[0];
          const formData = new FormData();
          formData.append("file", file);

          uploadImageAction(formData).then((result) => {
            if (!result.success || !result.url) {
              toast({
                variant: "destructive",
                title: "Upload Failed",
                description: result.error || "Unknown upload error",
              });
              return;
            }

            if (file.type.startsWith("image/")) {
              view.dispatch(
                view.state.tr.replaceSelectionWith(
                  view.state.schema.nodes.image.create({ src: result.url })
                )
              );
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
      syncInlineQueries(editor);
    }
  }, [content, editor]);

  useEffect(() => {
    if (!editor?.isFocused) {
      setMobileColorPickerOpen(false);
    }
  }, [editor?.isFocused]);

  useEffect(() => {
    if (autoFocus && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [autoFocus]);

  if (!editor) return null;

  const activeColor = editor.getAttributes("textStyle").color as string | undefined;
  const keepMobileEditorFocus = (event: React.PointerEvent<HTMLElement>) => {
    event.preventDefault();
  };

  const runTabAction = () => {
    const focusPos = lastSelectionRef.current?.from;
    const focusedChain = editor.chain().focus(focusPos);

    const handledByKeymap = focusedChain.keyboardShortcut("Tab").run();
    if (handledByKeymap) return;

    const taskHandled = editor.chain().focus(focusPos).sinkListItem("taskItem").run();
    if (taskHandled) return;

    const listHandled = editor.chain().focus(focusPos).sinkListItem("listItem").run();
    if (listHandled) return;

    // Fallback: call ProseMirror list command directly.
    const pmHandled = editor.commands.command(({ state, dispatch }) => {
      const listItemType = state.schema.nodes.listItem;
      if (!listItemType) return false;
      return pmSinkListItem(listItemType)(state, dispatch);
    });
    if (pmHandled) return;

    editor.chain().focus(focusPos).insertContent("    ").run();
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-background overflow-hidden",
        !isMobile && "rounded-md border shadow-sm"
      )}
    >
      {!isMobile && (
        <div className="flex items-center gap-1 p-2 border-b bg-muted/20 overflow-x-auto scrollbar-hide whitespace-nowrap">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? "bg-accent" : ""}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? "bg-accent" : ""}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().setHeading({ level: 1 }).run()}
            className={editor.isActive("heading", { level: 1 }) ? "bg-accent" : ""}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().setHeading({ level: 2 }).run()}
            className={editor.isActive("heading", { level: 2 }) ? "bg-accent" : ""}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().setHeading({ level: 3 }).run()}
            className={editor.isActive("heading", { level: 3 }) ? "bg-accent" : ""}
          >
            <Heading3 className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="mx-1 h-6" />
          {EDITOR_COLOR_PALETTE.map((colorOption) => {
            const isDefault = colorOption.label === "Default";
            const isActive = isDefault ? !activeColor : activeColor === colorOption.value;

            return (
              <Button
                key={colorOption.value}
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (isDefault) {
                    editor.chain().focus().unsetColor().run();
                  } else {
                    editor.chain().focus().setColor(colorOption.value).run();
                  }
                }}
                className={cn(
                  "h-8 w-8 p-0 border",
                  isActive && "ring-2 ring-sky-500 ring-offset-1"
                )}
                title={colorOption.label}
              >
                <span
                  className="h-4 w-4 rounded-full border"
                  style={{ backgroundColor: colorOption.value }}
                />
              </Button>
            );
          })}
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive("bulletList") ? "bg-accent" : ""}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive("orderedList") ? "bg-accent" : ""}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={editor.isActive("taskList") ? "bg-accent" : ""}
          >
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

        {tagQuery && !slashQuery && filteredTagSuggestions.length > 0 && (
          <div className="mt-3 w-full max-w-md rounded-md border bg-popover shadow-lg p-1">
            {filteredTagSuggestions.map((tag, index) => (
              <button
                key={tag}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-sm rounded",
                  index === activeTagSuggestionIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                )}
                onMouseDown={(event) => {
                  event.preventDefault();
                  editor
                    .chain()
                    .focus()
                    .insertContentAt({ from: tagQuery.from, to: tagQuery.to }, `#${tag} `)
                    .run();
                  setTagQuery(null);
                }}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {slashQuery && filteredSlashCommands.length > 0 && slashMenuPosition && (
        <div
          className="fixed z-[80] w-[min(340px,calc(100vw-24px))] rounded-xl border bg-popover shadow-2xl overflow-hidden"
          style={{ top: slashMenuPosition.top, left: slashMenuPosition.left }}
        >
          <div className="max-h-[360px] overflow-y-auto p-1.5">
            {filteredSlashCommands.map((command, index) => {
              const icon = command.id === "text"
                ? <Pilcrow className="h-4 w-4" />
                : command.id === "h1"
                  ? <Heading1 className="h-4 w-4" />
                  : command.id === "h2"
                    ? <Heading2 className="h-4 w-4" />
                    : command.id === "h3"
                      ? <Heading3 className="h-4 w-4" />
                      : command.id === "bullet"
                        ? <List className="h-4 w-4" />
                        : command.id === "numbered"
                          ? <ListOrdered className="h-4 w-4" />
                          : command.id === "task"
                            ? <CheckSquare className="h-4 w-4" />
                            : command.id === "quote"
                              ? <Quote className="h-4 w-4" />
                              : command.id === "divider"
                                ? <Minus className="h-4 w-4" />
                                : command.id === "code"
                                  ? <Code2 className="h-4 w-4" />
                                  : <CalendarDays className="h-4 w-4" />;

              return (
                <button
                  key={command.id}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded-md grid grid-cols-[18px_1fr_auto] items-center gap-2",
                    index === activeSlashSuggestionIndex
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  )}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    if (!slashQuery) return;
                    runSlashCommand(editor, slashQuery, command);
                    setSlashQuery(null);
                  }}
                  >
                  <span className="text-muted-foreground">{icon}</span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium leading-5 truncate">
                      {command.title}
                    </span>
                  </span>
                  {command.hint && (
                    <span className="text-[10px] rounded px-1.5 py-0.5 bg-muted text-muted-foreground leading-none">
                      {command.hint}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isMobile && editor.isFocused && (
        <>
          {mobileColorPickerOpen && (
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              className="fixed left-2 right-2 z-[80] rounded-xl border bg-background/95 backdrop-blur-md shadow-lg px-2 py-2"
              style={{
                bottom: `calc(env(safe-area-inset-bottom, 0px) + ${mobileKeyboardOffset + 62}px)`,
              }}
            >
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                {EDITOR_COLOR_PALETTE.map((colorOption) => {
                  const isDefault = colorOption.label === "Default";
                  const isActive = isDefault ? !activeColor : activeColor === colorOption.value;

                  return (
                    <Button
                      key={`mobile-panel-${colorOption.value}`}
                      size="icon"
                      variant="ghost"
                      onPointerDown={keepMobileEditorFocus}
                      className={cn(
                        "h-10 w-10 shrink-0",
                        isActive ? "bg-sky-500/20" : "text-foreground/80"
                      )}
                      onClick={() => {
                        if (isDefault) {
                          editor.chain().focus().unsetColor().run();
                        } else {
                          editor.chain().focus().setColor(colorOption.value).run();
                        }
                        setMobileColorPickerOpen(false);
                      }}
                    >
                      <span
                        className={cn(
                          "h-4 w-4 rounded-full border",
                          isActive && "ring-2 ring-sky-500 ring-offset-1"
                        )}
                        style={{ backgroundColor: colorOption.value }}
                      />
                    </Button>
                  );
                })}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed left-0 right-0 z-[75] border-t bg-background/95 backdrop-blur-md overflow-x-auto scrollbar-hide py-1 px-1"
            style={{
              bottom: `calc(env(safe-area-inset-bottom, 0px) + ${mobileKeyboardOffset}px)`,
            }}
          >
            <div className="flex items-center gap-0 min-w-max">
            <Button
              size="icon"
              variant="ghost"
              onPointerDown={keepMobileEditorFocus}
              className="h-11 w-11 text-foreground/80"
              onClick={runTabAction}
              title="Tab / 들여쓰기"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onPointerDown={keepMobileEditorFocus}
              className={cn(
                "h-11 w-11",
                mobileColorPickerOpen ? "text-sky-300 bg-sky-500/20" : "text-foreground/80"
              )}
              onClick={() => setMobileColorPickerOpen((prev) => !prev)}
              title="Text color"
            >
              <Palette className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onPointerDown={keepMobileEditorFocus}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn(
                "h-11 w-11",
                editor.isActive("bulletList")
                  ? "text-sky-300 bg-sky-500/20"
                  : "text-foreground/80"
              )}
            >
              <List className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onPointerDown={keepMobileEditorFocus}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn(
                "h-11 w-11",
                editor.isActive("orderedList")
                  ? "text-sky-300 bg-sky-500/20"
                  : "text-foreground/80"
              )}
            >
              <ListOrdered className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onPointerDown={keepMobileEditorFocus}
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={cn(
                "h-11 w-11",
                editor.isActive("taskList")
                  ? "text-sky-300 bg-sky-500/20"
                  : "text-foreground/80"
              )}
            >
              <CheckSquare className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onPointerDown={keepMobileEditorFocus}
              className="h-11 w-11 text-foreground/80"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onPointerDown={keepMobileEditorFocus}
              onClick={() => editor.chain().focus().setHeading({ level: 1 }).run()}
              className={cn(
                "h-11 w-11",
                editor.isActive("heading")
                  ? "text-sky-300 bg-sky-500/20"
                  : "text-foreground/80"
              )}
            >
              <div className="flex items-baseline">
                <span className="text-lg font-bold leading-none">H</span>
              </div>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onPointerDown={keepMobileEditorFocus}
              className="h-11 w-11 text-foreground/80"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().chain().focus().undo().run()}
            >
              <Undo2 className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onPointerDown={keepMobileEditorFocus}
              className="h-11 w-11 text-foreground/80"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().chain().focus().redo().run()}
            >
              <Redo2 className="h-5 w-5" />
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button
              size="icon"
              variant="ghost"
              onPointerDown={keepMobileEditorFocus}
              className="h-11 w-11 text-foreground/80"
              onClick={() => {
                editor.commands.blur();
              }}
            >
              <ChevronDown className="h-6 w-6" />
            </Button>
            </div>
          </motion.div>
        </>
      )}

      <div
        className={cn(
          "p-1.5 border-t text-[9px] text-muted-foreground/50 flex justify-between bg-muted/5",
          isMobile && editor.isFocused && "hidden"
        )}
      >
        <span>Markdown Synced</span>
        <span>
          Words: {(editor.storage as any).markdown.getMarkdown().split(/\s+/).filter(Boolean).length}
        </span>
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
          event.target.value = "";
        }}
      />
    </div>
  );
}
