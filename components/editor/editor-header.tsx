"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, Share2, History, Sparkles } from "lucide-react"
import { useSession } from "next-auth/react"
import { ConnectionStatus } from "./connection-status"

interface EditorHeaderProps {
  documentId: string
  initialTitle: string
  onToggleHistory: () => void
  onToggleShare: () => void
}

export function EditorHeader({ documentId, initialTitle, onToggleHistory, onToggleShare }: EditorHeaderProps) {
  const { data: session } = useSession()
  const [title, setTitle] = useState(initialTitle)
  
  const userInitial = session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || "U"

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    
    // Clear the previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set a new timeout to debounce the API call
    timeoutRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/documents/${documentId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: newTitle || 'Untitled Document' }),
        })
      } catch (error) {
        console.error('Failed to update title:', error)
      }
    }, 1000)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])


  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-xl z-30">
      <div className="flex items-center gap-4 flex-1">
        <Link 
          href="/dashboard"
          className="p-2 -ml-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled Document"
          className="bg-transparent border-none outline-none text-sm font-medium text-white placeholder:text-zinc-600 w-full max-w-sm focus:ring-2 focus:ring-blue-500/50 rounded px-2 py-1 -ml-2 transition-all"
        />
        
        <div className="hidden sm:block">
          <ConnectionStatus />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Current user avatar (collaborators would go here as well) */}
        <div className="flex -space-x-2 mr-4">
          <div className="w-7 h-7 rounded-full bg-blue-500 border-2 border-zinc-950 flex items-center justify-center text-[10px] font-bold text-white z-10" title={session?.user?.name || session?.user?.email || "User"}>
            {userInitial}
          </div>
        </div>

        <button 
          onClick={onToggleHistory}
          className="flex items-center gap-2 text-xs font-medium text-zinc-400 bg-zinc-900 hover:bg-zinc-800 hover:text-white px-3 py-1.5 rounded-md transition-colors border border-zinc-800"
        >
          <History className="w-4 h-4" />
          <span className="hidden sm:inline">History</span>
        </button>
        
        <button 
          onClick={onToggleShare}
          className="flex items-center gap-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-md transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>
    </header>
  )
}
