"use client"

import { useState, useEffect } from "react"
import { EditorHeader } from "./editor-header"
import { DocumentEditor } from "./document-editor"
import { VersionPanel } from "../version-history/version-panel"
import { ShareModal } from "./share-modal"
import { SnapshotManager } from "@/lib/versioning/snapshot-manager"
import * as Y from "yjs"

interface EditorClientWrapperProps {
  documentId: string
  initialTitle: string
}

export function EditorClientWrapper({ documentId, initialTitle }: EditorClientWrapperProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null)

  useEffect(() => {
    if (!ydoc) return

    // Auto-snapshot every 10 minutes (600000ms)
    const interval = setInterval(async () => {
      try {
        const state = SnapshotManager.captureSnapshot(ydoc)
        await fetch(`/api/documents/${documentId}/versions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            state,
            name: `Auto-save ${new Date().toLocaleTimeString()}`
          }),
        })
      } catch (error) {
        console.error("Auto-snapshot failed:", error)
      }
    }, 600000)

    return () => clearInterval(interval)
  }, [ydoc, documentId])

  const handleRestore = (state: Uint8Array) => {
    if (ydoc) {
      SnapshotManager.restoreSnapshot(ydoc, state)
    }
  }

  return (
    <div className="flex flex-col h-full z-10 w-full relative overflow-hidden">
      <EditorHeader 
        documentId={documentId} 
        initialTitle={initialTitle} 
        onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)} 
        onToggleShare={() => setIsShareOpen(!isShareOpen)}
      />
      
      <div className="flex-1 overflow-hidden relative flex">
        <div className={`flex-1 transition-all duration-300 ${isHistoryOpen ? 'mr-80' : ''}`}>
          <DocumentEditor 
            documentId={documentId} 
            onYdocReady={(doc) => setYdoc(doc)}
          />
        </div>
        
        {ydoc && (
          <VersionPanel 
            documentId={documentId}
            ydoc={ydoc}
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            onRestore={handleRestore}
          />
        )}
      </div>

      <ShareModal 
        documentId={documentId}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  )
}
