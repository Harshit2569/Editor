"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { YjsCollaboration } from "@/lib/crdt/collaboration-extension"
import { DocumentProvider } from "@/lib/crdt/document-provider"
import { SyncEngine, useSyncStore } from "@/lib/crdt/sync-engine"
import { getRandomColor } from "@/lib/crdt/awareness"
import { EditorToolbar } from "./editor-toolbar"
import * as Y from "yjs"

interface DocumentEditorProps {
  documentId: string
  onYdocReady?: (ydoc: Y.Doc) => void
}

export function DocumentEditor({ documentId, onYdocReady }: DocumentEditorProps) {
  const { data: session } = useSession()
  const [provider, setProvider] = useState<DocumentProvider | null>(null)
  const [isSynced, setIsSynced] = useState(false)
  const engineRef = useRef<SyncEngine | null>(null)

  const onYdocReadyRef = useRef(onYdocReady)

  useEffect(() => {
    onYdocReadyRef.current = onYdocReady
  }, [onYdocReady])

  // Initialize Yjs and Hocuspocus
  useEffect(() => {
    if (!session?.user?.id) return

    let destroyed = false

    // Create provider with JWT/Session token
    const docProvider = new DocumentProvider(documentId, session.user.id)
    
    // Set up sync engine
    engineRef.current = new SyncEngine(docProvider)

    // Wait for at least one sync source to be ready before enabling the editor.
    // IndexedDB (local-first) syncs fastest; the Hocuspocus WebSocket may not
    // be available at all (e.g. running `next dev` without the custom server).
    let localSynced = false
    let remoteSynced = false

    const markReady = () => {
      if (!destroyed) {
        setIsSynced(true)
      }
    }

    // IndexedDB sync fires when the local persisted state has been loaded
    docProvider.persistence.on("synced", () => {
      localSynced = true
      markReady()
    })

    // Hocuspocus provider "synced" fires after initial server state is applied
    docProvider.provider.on("synced", () => {
      remoteSynced = true
      markReady()
    })

    // Fallback: if neither sync fires within 2s (e.g. fresh doc, no IndexedDB,
    // no server), initialize the fragment so the editor can still mount.
    const fallbackTimer = setTimeout(() => {
      if (!localSynced && !remoteSynced && !destroyed) {
        docProvider.ydoc.getXmlFragment("default")
        markReady()
      }
    }, 2000)

    // Connect to websocket (after listeners are attached)
    docProvider.connect()

    // Debugging logs for Hocuspocus connection lifecycle
    docProvider.provider.on('status', (data: { status: string }) => console.log('[Hocuspocus] Status changed:', data.status))
    docProvider.websocketProvider.on('status', (data: { status: string }) => console.log('[Hocuspocus WS] Status changed:', data.status))
    docProvider.provider.on('disconnect', () => console.log('[Hocuspocus] Disconnected'))
    docProvider.provider.on('destroy', () => console.log('[Hocuspocus] Destroyed'))

    // Wrap in setTimeout to avoid synchronous state update in effect
    setTimeout(() => {
      if (!destroyed) {
        setProvider(docProvider)
      }
    }, 0)
    
    if (onYdocReadyRef.current) {
      onYdocReadyRef.current(docProvider.ydoc)
    }

    return () => {
      destroyed = true
      clearTimeout(fallbackTimer)
      docProvider.destroy()
      setIsSynced(false)
      useSyncStore.getState().setStatus("disconnected")
    }
  }, [documentId, session?.user?.id]) // REMOVED setStatus to prevent infinite remount loops

  if (!provider || !isSynced) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-sm text-zinc-400">Loading document...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100">
      <TiptapEditor provider={provider} session={session} />

      {/* Collaboration Cursor Styles (rendered by y-prosemirror's yCursorPlugin) */}
      <style jsx global>{`
        /* Remote user cursor caret */
        .yRemoteSelectionHead {
          position: relative;
          border-left: 2px solid orange;
          margin-left: -1px;
          margin-right: -1px;
          pointer-events: none;
          word-break: normal;
        }

        /* Remote user name label (child div of the caret widget) */
        .yRemoteSelectionHead > div {
          position: absolute;
          top: -1.4em;
          left: -2px;
          font-size: 0.7rem;
          font-weight: 600;
          line-height: 1;
          white-space: nowrap;
          color: white;
          padding: 2px 6px;
          border-radius: 4px 4px 4px 0;
          user-select: none;
          pointer-events: none;
          opacity: 0.9;
          transition: opacity 0.2s ease;
          z-index: 50;
        }

        /* Remote user text selection highlight */
        .yRemoteSelection {
          opacity: 0.45;
        }
      `}</style>
    </div>
  )
}

import { Session } from "next-auth"

function TiptapEditor({ provider, session }: { provider: DocumentProvider; session: Session | null }) {
  const userColor = getRandomColor(session?.user?.id)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Disable ProseMirror's built-in history — Yjs handles undo/redo
        history: false,
      } as Record<string, unknown>),
      YjsCollaboration.configure({
        document: provider.ydoc,
        awareness: provider.provider.awareness,
        user: {
          name: session?.user?.name || session?.user?.email || "Anonymous",
          color: userColor,
          colorLight: `${userColor}33`,
        },
        field: "default",
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-blue max-w-none focus:outline-none min-h-[500px]',
      },
    },
    content: '',
  })

  if (!editor) return null

  return (
    <>
      <EditorToolbar editor={editor} />
      
      <div className="flex-1 overflow-auto p-4 sm:p-8 lg:p-12 relative z-10">
        <div className="max-w-4xl mx-auto bg-zinc-900/30 backdrop-blur border border-zinc-800/50 rounded-xl p-8 sm:p-12 shadow-2xl min-h-full">
          <EditorContent editor={editor} />
        </div>
      </div>
    </>
  )
}
