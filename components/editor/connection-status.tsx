"use client"

import { useSyncStore } from "@/lib/crdt/sync-engine"
import { Cloud, CloudOff, RefreshCw, CheckCircle2 } from "lucide-react"

export function ConnectionStatus() {
  const { status, pendingChanges, lastSyncedAt } = useSyncStore()

  if (status === "connecting") {
    return (
      <div className="flex items-center gap-2 text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        Connecting...
      </div>
    )
  }

  if (status === "disconnected") {
    return (
      <div className="flex items-center gap-2 text-xs font-medium text-red-400 bg-red-400/10 px-2 py-1 rounded-full" title="Working offline. Changes are saved locally.">
        <CloudOff className="w-3.5 h-3.5" />
        Offline
        {/* {pendingChanges > 0 && <span className="text-[10px] bg-red-500/20 px-1.5 rounded-full">{pendingChanges}</span>} */}
      </div>
    )
  }

  if (status === "syncing") {
    return (
      <div className="flex items-center gap-2 text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        Saving...
      </div>
    )
  }

  // Connected status
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
      <Cloud className="w-3.5 h-3.5" />
      Saved
    </div>
  )
}
