import { Loader2 } from "lucide-react"

export default function EditorLoading() {
  return (
    <div className="flex-1 flex flex-col h-screen bg-zinc-950">
      <header className="h-14 flex items-center justify-between px-4 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-md bg-zinc-800 animate-pulse" />
          <div className="w-48 h-6 rounded-md bg-zinc-800 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-8 rounded-md bg-zinc-800 animate-pulse" />
          <div className="w-20 h-8 rounded-md bg-zinc-800 animate-pulse" />
        </div>
      </header>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-zinc-400">Loading document...</p>
        </div>
      </div>
    </div>
  )
}
