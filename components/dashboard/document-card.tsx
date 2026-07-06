"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { FileText, MoreVertical, Clock, Users, Trash2, RotateCcw, XCircle } from "lucide-react"
import { useState, useRef, useEffect } from "react"

interface DocumentCardProps {
  document: {
    id: string
    title: string
    updatedAt: Date
    owner: { name: string | null, image: string | null, email: string | null }
    roles: Array<{ user: { name: string | null, image: string | null, email: string | null } }>
  }
  userRole: string
  isTrashPage?: boolean
}

export function DocumentCard({ document, userRole, isTrashPage }: DocumentCardProps) {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const allUsers = [document.owner, ...document.roles.map((r: any) => r.user)]
  const displayUsers = allUsers.slice(0, 3)
  const extraUsers = allUsers.length > 3 ? allUsers.length - 3 : 0

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    
    if (isMenuOpen) {
      window.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      window.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isMenuOpen])

  const handleAction = async (e: React.MouseEvent, action: "trash" | "restore" | "delete") => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isActionLoading) return
    setIsActionLoading(true)

    try {
      let response;
      if (action === "trash") {
        response = await fetch(`/api/documents/${document.id}/trash`, { method: "POST" })
      } else if (action === "restore") {
        response = await fetch(`/api/documents/${document.id}/trash`, { method: "PATCH" })
      } else if (action === "delete") {
        response = await fetch(`/api/documents/${document.id}/trash`, { method: "DELETE" })
      }

      if (response && response.ok) {
        router.refresh()
      } else {
        const text = await response?.text()
        console.error("Failed action:", text)
        alert(text || "Action failed")
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsActionLoading(false)
      setIsMenuOpen(false)
    }
  }

  const isOwner = userRole === "OWNER"

  return (
    <Link href={`/editor/${document.id}`} className="block group">
      <div className="flex flex-col h-48 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 transition-all hover:bg-zinc-800/40 hover:border-zinc-700 relative overflow-visible">
        {/* Hover gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-violet-500/0 group-hover:from-blue-500/5 group-hover:to-violet-500/5 transition-all duration-500 pointer-events-none rounded-xl" />
        
        <div className="flex items-start justify-between relative z-10">
          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-700/50 shadow-inner">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          
          <div className="relative" ref={menuRef}>
            <button 
              className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsMenuOpen(!isMenuOpen)
              }}
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {isMenuOpen && isOwner && (
              <div className="absolute right-0 top-8 w-48 rounded-md bg-zinc-900 border border-zinc-800 shadow-xl overflow-hidden z-50">
                {!isTrashPage ? (
                  <button 
                    onClick={(e) => handleAction(e, "trash")}
                    disabled={isActionLoading}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-zinc-800 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" /> Move to Trash
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={(e) => handleAction(e, "restore")}
                      disabled={isActionLoading}
                      className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2 disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" /> Restore
                    </button>
                    <button 
                      onClick={(e) => handleAction(e, "delete")}
                      disabled={isActionLoading}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-zinc-800 flex items-center gap-2 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" /> Delete Permanently
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 relative z-0">
          <h3 className="text-lg font-medium text-zinc-100 group-hover:text-white transition-colors line-clamp-1">
            {document.title}
          </h3>
          <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
            <Clock className="w-3.5 h-3.5" />
            <span suppressHydrationWarning>Updated {formatDistanceToNow(new Date(document.updatedAt))} ago</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between relative z-0">
          <div className="flex items-center -space-x-2">
            {displayUsers.map((user, i) => (
              <div 
                key={i} 
                className="w-7 h-7 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-[10px] font-bold text-white relative z-10 overflow-hidden"
                title={user.name || user.email || "Unknown user"}
              >
                {user.image ? (
                  <img src={user.image} alt={user.name || ""} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                    {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
              </div>
            ))}
            {extraUsers > 0 && (
              <div className="w-7 h-7 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-[10px] font-bold text-zinc-400 relative z-0">
                +{extraUsers}
              </div>
            )}
          </div>

          <div className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-zinc-800/80 text-zinc-400">
            {userRole}
          </div>
        </div>
      </div>
    </Link>
  )
}
