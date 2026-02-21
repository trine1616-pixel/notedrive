"use client";

import { Extension } from "@tiptap/core";
import { Editor } from "@tiptap/react";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Plugin, PluginKey } from "@tiptap/pm/state";

const HASHTAG_REGEX = /(^|[\s(])#([\w\u00C0-\u00FF\uAC00-\uD7A3-]+)/g;

export const HashtagHighlight = Extension.create({
  name: "hashtagHighlight",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("hashtagHighlight"),
        props: {
          decorations: (state) => {
            const decorations: Decoration[] = [];
            state.doc.descendants((node, pos) => {
              if (!node.isText || !node.text) return;

              let match: RegExpExecArray | null;
              HASHTAG_REGEX.lastIndex = 0;
              while ((match = HASHTAG_REGEX.exec(node.text)) !== null) {
                const prefix = match[1] || "";
                const tag = match[2] || "";
                if (!tag) continue;

                const start = pos + match.index + prefix.length;
                const end = start + 1 + tag.length;
                decorations.push(
                  Decoration.inline(start, end, {
                    class: "nd-hashtag-token",
                  })
                );
              }
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

export type HashtagQuery = {
  query: string;
  from: number;
  to: number;
};

export function getHashtagQuery(editor: Editor): HashtagQuery | null {
  const { from, to } = editor.state.selection;
  if (from !== to) return null;

  const start = Math.max(1, from - 120);
  const textBefore = editor.state.doc.textBetween(start, from, "\n", " ");
  const match = textBefore.match(/(?:^|\s)#([\w\u00C0-\u00FF\uAC00-\uD7A3-]*)$/);
  if (!match) return null;

  const query = match[1] ?? "";
  const fromPos = from - (query.length + 1);
  if (fromPos < 1) return null;

  return { query, from: fromPos, to };
}
