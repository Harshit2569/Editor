/**
 * Custom Tiptap extension that uses y-prosemirror directly for both
 * document sync AND collaboration cursors.
 *
 * Why not use @tiptap/extension-collaboration + @tiptap/extension-collaboration-cursor?
 * ──────────────────────────────────────────────────────────────────────────────
 * @tiptap/extension-collaboration@3.27.1 bundles its own copy of y-prosemirror,
 * while @tiptap/extension-collaboration-cursor (latest: 3.0.0) imports from the
 * separately installed y-prosemirror package. Because pnpm strictly isolates
 * dependencies, each package gets its own `ySyncPluginKey` instance. When the
 * cursor plugin calls `ySyncPluginKey.getState(state)`, it gets `undefined`
 * (different key object → no match) and crashes with:
 *   "Cannot read properties of undefined (reading 'doc')"
 *
 * By importing BOTH `ySyncPlugin` and `yCursorPlugin` from the same
 * `y-prosemirror` package here, they share one `ySyncPluginKey` and work
 * together correctly.
 */

import { Extension } from "@tiptap/react"
import { ySyncPlugin, yCursorPlugin, ySyncPluginKey } from "y-prosemirror"
import * as Y from "yjs"
import type { Awareness } from "y-protocols/awareness"

export interface YjsCollaborationOptions {
  /** The Yjs document to sync with the editor */
  document: Y.Doc
  /** Awareness instance from HocuspocusProvider for cursor broadcasting */
  awareness: Awareness | null
  /** Local user info for cursor rendering */
  user: {
    name: string
    color: string
    colorLight?: string
  }
  /** Name of the XmlFragment within the Y.Doc (default: "default") */
  field: string
}

export const YjsCollaboration = Extension.create<YjsCollaborationOptions>({
  name: "yjsCollaboration",

  // This extension replaces StarterKit's history — collaborative undo is
  // handled by Yjs, not ProseMirror's built-in undo stack.
  priority: 1000,

  addOptions() {
    return {
      document: null as unknown as Y.Doc,
      awareness: null as unknown as Awareness,
      user: {
        name: "Anonymous",
        color: "#6B7280",
        colorLight: "#6B728033",
      },
      field: "default",
    }
  },

  addProseMirrorPlugins() {
    const { document: ydoc, awareness, user, field } = this.options

    if (!ydoc) {
      console.warn("[YjsCollaboration] No Y.Doc provided — skipping sync plugins")
      return []
    }

    const fragment = ydoc.getXmlFragment(field)

    // 1. Sync plugin — bidirectional sync between ProseMirror ↔ Yjs
    const plugins = [ySyncPlugin(fragment)]

    // 2. Cursor plugin — broadcasts local selection & renders remote cursors
    if (awareness) {
      // Set local user info so remote peers can render our cursor
      awareness.setLocalStateField("user", {
        name: user.name,
        color: user.color,
        colorLight: user.colorLight || `${user.color}33`,
      })

      plugins.push(yCursorPlugin(awareness))
    }

    return plugins
  },
})

// Re-export for use in other modules (e.g. version snapshots)
export { ySyncPluginKey }
