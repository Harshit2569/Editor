"use client"

import { useState, useEffect } from "react"
import { X, Users, Shield, ShieldAlert, UserMinus, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ShareModalProps {
  documentId: string
  isOpen: boolean
  onClose: () => void
}

interface User {
  id: string
  name: string | null
  email: string | null
  image: string | null
}

interface Role {
  user: User
  role: "VIEWER" | "EDITOR"
}

export function ShareModal({ documentId, isOpen, onClose }: ShareModalProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"VIEWER" | "EDITOR">("VIEWER")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  
  const [owner, setOwner] = useState<User | null>(null)
  const [roles, setRoles] = useState<Role[]>([])

  useEffect(() => {
    if (isOpen) {
      fetchRoles()
    }
  }, [isOpen, documentId])

  const fetchRoles = async () => {
    setIsFetching(true)
    try {
      const res = await fetch(`/api/documents/${documentId}/share`)
      if (res.ok) {
        const data = await res.json()
        setOwner(data.owner)
        setRoles(data.roles)
      }
    } catch (error) {
      toast.error("Failed to load collaborators")
    } finally {
      setIsFetching(false)
    }
  }

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      })

      if (res.ok) {
        toast.success("Document shared successfully")
        setEmail("")
        fetchRoles()
      } else {
        const error = await res.text()
        toast.error(error || "Failed to share document")
      }
    } catch (error) {
      toast.error("Error sharing document")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async (userId: string) => {
    try {
      const res = await fetch(`/api/documents/${documentId}/share?userId=${userId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("Collaborator removed")
        fetchRoles()
      } else {
        toast.error("Failed to remove collaborator")
      }
    } catch (error) {
      toast.error("Error removing collaborator")
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-2 text-white font-medium">
            <Users className="w-5 h-5 text-blue-400" />
            Share Document
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-zinc-800">
          <form onSubmit={handleShare} className="flex gap-2">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="VIEWER">Can view</option>
              <option value="EDITOR">Can edit</option>
            </select>
            <button
              type="submit"
              disabled={isLoading || !email}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Invite"}
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[300px] p-2">
          {isFetching ? (
            <div className="flex justify-center p-4">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
            </div>
          ) : (
            <div className="space-y-1">
              {/* Owner */}
              {owner && (
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-900/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
                      {owner.name?.charAt(0).toUpperCase() || owner.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{owner.name || 'User'} (You)</div>
                      <div className="text-xs text-zinc-500">{owner.email}</div>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-zinc-400 bg-zinc-800 px-2 py-1 rounded">
                    Owner
                  </div>
                </div>
              )}

              {/* Collaborators */}
              {roles.map((r) => (
                <div key={r.user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-900/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-xs font-bold text-white">
                      {r.user.name?.charAt(0).toUpperCase() || r.user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{r.user.name || 'User'}</div>
                      <div className="text-xs text-zinc-500">{r.user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs font-medium text-zinc-400 bg-zinc-800 px-2 py-1 rounded">
                      {r.role === "EDITOR" ? <Shield className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                      {r.role === "EDITOR" ? "Editor" : "Viewer"}
                    </div>
                    <button
                      onClick={() => handleRemove(r.user.id)}
                      className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                      title="Remove access"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
