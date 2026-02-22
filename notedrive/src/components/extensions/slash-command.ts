import type { Editor } from "@tiptap/react";
import type { EditorSlashCommand } from "@/lib/editor-commands";

export type SlashQuery = {
  query: string;
  from: number;
  to: number;
};

export function getSlashQuery(editor: Editor): SlashQuery | null {
  const { from, to } = editor.state.selection;
  if (from !== to) return null;

  const { $from } = editor.state.selection;
  const parent = $from.parent;
  if (!parent.isTextblock || parent.type.spec.code) return null;

  const start = Math.max(1, from - 120);
  const textBefore = editor.state.doc.textBetween(start, from, "\n", " ");
  const match = textBefore.match(/(?:^|\s)\/([a-zA-Z0-9-]*)$/);
  if (!match) return null;

  const query = match[1] ?? "";
  const fromPos = from - (query.length + 1);
  if (fromPos < 1) return null;

  return { query, from: fromPos, to };
}

export function filterSlashCommands(
  commands: EditorSlashCommand[],
  query: string
): EditorSlashCommand[] {
  const q = query.trim().toLowerCase();
  if (!q) return commands;

  return commands
    .filter((command) => {
      if (command.title.toLowerCase().includes(q)) return true;
      if (command.description.toLowerCase().includes(q)) return true;
      return command.keywords.some((keyword) =>
        keyword.toLowerCase().includes(q)
      );
    });
}

export function runSlashCommand(
  editor: Editor,
  slashQuery: SlashQuery,
  command: EditorSlashCommand
) {
  editor
    .chain()
    .focus()
    .deleteRange({ from: slashQuery.from, to: slashQuery.to })
    .run();
  command.run(editor);
}
