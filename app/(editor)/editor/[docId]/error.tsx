"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, Home, RefreshCw } from "lucide-react"

export default function EditorError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Editor error:", error)
  }, [error])

  return (
    <div className="flex-1 flex items-center justify-center bg-zinc-950 p-4">
      <div className="max-w-md w-full bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-8 flex flex-col items-center text-center shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong!</h2>
        <p className="text-sm text-zinc-400 mb-8">
          We encountered an error while trying to load the document. This could be due to a network issue or the document might no longer exist.
        </p>
        
        <div className="flex flex-col sm:flex-row w-full gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md py-2 px-4 transition-colors font-medium shadow-[0_0_15px_rgba(37,99,235,0.3)]"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
          
          <Link
            href="/dashboard"
            className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md py-2 px-4 transition-colors font-medium"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
