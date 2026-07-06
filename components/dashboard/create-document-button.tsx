"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

export function CreateDocumentButton({ className }: { className?: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const onClick = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Untitled Document",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create document")
      }

      const document = await response.json()
      router.push(`/editor/${document.id}`)
    } catch (error) {
      console.error(error)
      // Optional: Add toast notification here
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`bg-blue-600 hover:bg-blue-500 text-white rounded-md py-2 px-6 transition-colors font-medium shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${className || ""}`}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <Plus className="w-5 h-5" />
      )}
      Create Document
    </button>
  )
}
