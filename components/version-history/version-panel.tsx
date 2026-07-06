"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { History, X, Save, Clock, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import * as Y from "yjs"
import { SnapshotManager } from "@/lib/versioning/snapshot-manager"

interface Version {
  id: string
  name: string
  createdAt: string
}

interface VersionPanelProps {
  documentId: string
  ydoc: Y.Doc
  isOpen: boolean
  onClose: () => void
  onRestore: (state: Uint8Array) => void
}

export function VersionPanel({ documentId, ydoc, isOpen, onClose, onRestore }: VersionPanelProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchVersions()
    }
  }, [isOpen, documentId])

  const fetchVersions = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/documents/${documentId}/versions`)
      if (res.ok) {
        const data = await res.json()
        setVersions(data)
      }
    } catch (error) {
      toast.error("Failed to fetch version history")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSnapshot = async () => {
    setIsSaving(true)
    try {
      const state = SnapshotManager.captureSnapshot(ydoc)
      
      const res = await fetch(`/api/documents/${documentId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      })

      if (res.ok) {
        toast.success("Version saved successfully")
        fetchVersions()
      } else {
        toast.error("Failed to save version")
      }
    } catch (error) {
      toast.error("Error creating snapshot")
    } finally {
      setIsSaving(false)
    }
  }

  const handleRestore = async (versionId: string) => {
    if (!confirm("Are you sure you want to restore this version? Current changes will be overwritten.")) {
      return
    }

    try {
      const res = await fetch(`/api/documents/${documentId}/versions/${versionId}`)
      if (res.ok) {
        const data = await res.json()
        const stateArray = new Uint8Array(data.state)
        
        onRestore(stateArray)
        toast.success("Version restored")
        onClose()
      }
    } catch (error) {
      toast.error("Failed to restore version")
    }
  }

  if (!isOpen) return null

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-zinc-950 border-l border-zinc-800 z-40 flex flex-col shadow-2xl transition-transform duration-300">
      <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900/50">
        <div className="flex items-center gap-2 text-white font-medium">
          <History className="w-4 h-4 text-blue-400" />
          Version History
        </div>
        <button 
          onClick={onClose}
          className="p-1 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 border-b border-zinc-800">
        <button
          onClick={handleCreateSnapshot}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md py-2 px-4 transition-colors font-medium border border-zinc-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save Current Version"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-zinc-500">Loading versions...</div>
        ) : versions.length === 0 ? (
          <div className="p-4 text-center text-sm text-zinc-500">No versions saved yet</div>
        ) : (
          versions.map((version) => (
            <div 
              key={version.id}
              className="group flex flex-col p-3 rounded-lg hover:bg-zinc-800/50 transition-colors cursor-pointer border border-transparent hover:border-zinc-700/50"
              onClick={() => handleRestore(version.id)}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-sm text-zinc-200 group-hover:text-blue-400 transition-colors">
                  {version.name}
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all" />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Clock className="w-3 h-3" />
                {format(new Date(version.createdAt), "MMM d, yyyy 'at' h:mm a")}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
