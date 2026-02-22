import { format } from "date-fns";
import type { Editor } from "@tiptap/react";

type BlockContext = {
  from: number;
  to: number;
  textBeforeCursor: string;
  isCode: boolean;
};

function getCurrentBlockContext(editor: Editor): BlockContext | null {
  const { from, to, $from } = editor.state.selection;
  if (from !== to) return null;

  const parent = $from.parent;
  if (!parent.isTextblock) return null;

  const blockStart = $from.start();
  const textBeforeCursor = editor.state.doc.textBetween(
    blockStart,
    from,
    "\n",
    " "
  );

  return {
    from: blockStart,
    to: from,
    textBeforeCursor,
    isCode: parent.type.spec.code === true,
  };
}

export function applyMarkdownShortcutOnSpace(editor: Editor): boolean {
  const context = getCurrentBlockContext(editor);
  if (!context || context.isCode) return false;

  const marker = context.textBeforeCursor.trim();

  if (marker === "#") {
    editor
      .chain()
      .focus()
      .deleteRange({ from: context.from, to: context.to })
      .setHeading({ level: 1 })
      .run();
    return true;
  }

  if (marker === "##") {
    editor
      .chain()
      .focus()
      .deleteRange({ from: context.from, to: context.to })
      .setHeading({ level: 2 })
      .run();
    return true;
  }

  if (marker === "###") {
    editor
      .chain()
      .focus()
      .deleteRange({ from: context.from, to: context.to })
      .setHeading({ level: 3 })
      .run();
    return true;
  }

  // Let Tiptap built-in input rules handle "- " / "* " / "1. "
  // for more reliable list conversion across keyboard/layout variants.

  if (marker === "[]" || marker === "[ ]") {
    editor
      .chain()
      .focus()
      .deleteRange({ from: context.from, to: context.to })
      .toggleTaskList()
      .run();
    return true;
  }

  if (marker === "/date" || marker === "/today") {
    const today = format(new Date(), "yyyy-MM-dd");
    editor
      .chain()
      .focus()
      .deleteRange({ from: context.from, to: context.to })
      .insertContent(`${today} `)
      .run();
    return true;
  }

  return false;
}

export function applyMarkdownShortcutOnEnter(editor: Editor): boolean {
  const context = getCurrentBlockContext(editor);
  if (!context || context.isCode) return false;

  const marker = context.textBeforeCursor.trim();

  if (marker === "---") {
    editor
      .chain()
      .focus()
      .deleteRange({ from: context.from, to: context.to })
      .setHorizontalRule()
      .run();
    return true;
  }

  if (marker === "```") {
    editor
      .chain()
      .focus()
      .deleteRange({ from: context.from, to: context.to })
      .setCodeBlock()
      .run();
    return true;
  }

  return false;
}
