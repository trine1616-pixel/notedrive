import { format } from "date-fns";
import type { Editor } from "@tiptap/react";

export type EditorFontSizeOption = {
  id: "small" | "default" | "large";
  label: string;
  value: string | null;
};

export type EditorColorOption = {
  label: string;
  value: string;
};

export type EditorSlashCommand = {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  hint?: string;
  run: (editor: Editor) => void;
};

export const EDITOR_FONT_SIZES: EditorFontSizeOption[] = [
  { id: "small", label: "S", value: "0.875rem" },
  { id: "default", label: "M", value: null },
  { id: "large", label: "L", value: "1.25rem" },
];

export const EDITOR_COLOR_PALETTE: EditorColorOption[] = [
  { label: "Default", value: "#111827" },
  { label: "Blue", value: "#2563eb" },
  { label: "Green", value: "#16a34a" },
  { label: "Amber", value: "#d97706" },
  { label: "Rose", value: "#e11d48" },
  { label: "Purple", value: "#7c3aed" },
  { label: "Teal", value: "#0d9488" },
  { label: "Slate", value: "#475569" },
];

const defaultTodayText = () => format(new Date(), "yyyy-MM-dd");

export function createEditorSlashCommands(
  getTodayText: () => string = defaultTodayText
): EditorSlashCommand[] {
  return [
    {
      id: "text",
      title: "Text",
      description: "Convert to paragraph",
      keywords: ["paragraph", "plain", "text"],
      hint: "T",
      run: (editor) => {
        editor.chain().focus().setParagraph().run();
      },
    },
    {
      id: "h1",
      title: "Heading 1",
      description: "Large section heading",
      keywords: ["title", "h1", "heading"],
      hint: "#",
      run: (editor) => {
        editor.chain().focus().setHeading({ level: 1 }).run();
      },
    },
    {
      id: "h2",
      title: "Heading 2",
      description: "Medium section heading",
      keywords: ["subtitle", "h2", "heading"],
      hint: "##",
      run: (editor) => {
        editor.chain().focus().setHeading({ level: 2 }).run();
      },
    },
    {
      id: "h3",
      title: "Heading 3",
      description: "Small section heading",
      keywords: ["h3", "heading"],
      hint: "###",
      run: (editor) => {
        editor.chain().focus().setHeading({ level: 3 }).run();
      },
    },
    {
      id: "bullet",
      title: "Bulleted list",
      description: "Create a bulleted list",
      keywords: ["-", "*", "list", "bullet"],
      hint: "-",
      run: (editor) => {
        editor.chain().focus().toggleBulletList().run();
      },
    },
    {
      id: "numbered",
      title: "Numbered list",
      description: "Create an ordered list",
      keywords: ["1.", "ordered", "list", "numbered"],
      hint: "1.",
      run: (editor) => {
        editor.chain().focus().toggleOrderedList().run();
      },
    },
    {
      id: "task",
      title: "Checklist",
      description: "Track tasks with checkboxes",
      keywords: ["todo", "task", "check"],
      hint: "[]",
      run: (editor) => {
        editor.chain().focus().toggleTaskList().run();
      },
    },
    {
      id: "quote",
      title: "Quote",
      description: "Capture quoted text",
      keywords: ["blockquote", "quote"],
      hint: ">",
      run: (editor) => {
        editor.chain().focus().toggleBlockquote().run();
      },
    },
    {
      id: "divider",
      title: "Divider",
      description: "Insert a horizontal rule",
      keywords: ["separator", "line", "---"],
      hint: "---",
      run: (editor) => {
        editor.chain().focus().setHorizontalRule().run();
      },
    },
    {
      id: "code",
      title: "Code block",
      description: "Insert a fenced code block",
      keywords: ["```", "code", "snippet"],
      hint: "```",
      run: (editor) => {
        editor.chain().focus().setCodeBlock().run();
      },
    },
    {
      id: "today",
      title: "Today",
      description: "Insert today's date",
      keywords: ["date", "today", "/date", "/today"],
      hint: "/date",
      run: (editor) => {
        editor.chain().focus().insertContent(`${getTodayText()} `).run();
      },
    },
  ];
}
