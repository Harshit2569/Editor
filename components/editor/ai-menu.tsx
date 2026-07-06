"use client"

import { Editor } from "@tiptap/react"
import { useState, useRef, useEffect } from "react"
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

interface AiMenuProps {
  editor: Editor
}

export function AiMenu({ editor }: AiMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleAiAction = async (command: string) => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(false)
      setIsOpen(false)

      const selection = editor.state.selection
      const text = editor.state.doc.textBetween(selection.from, selection.to) || editor.getText()

      if (!text.trim()) {
        throw new Error("No text found to process.")
      }

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, text })
      })

      if (!response.ok) {
        throw new Error("AI request failed")
      }

      // Handle stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let resultText = ''

      if (reader) {
        // Prepare editor position
        let insertPos = selection.to
        if (command === 'summarize') {
            insertPos = editor.state.doc.content.size
            editor.chain().focus().insertContentAt(insertPos, '\n\n**AI Summary:**\n').run()
            insertPos += 17 // move cursor after the prefix
        } else if (command === 'continue-writing') {
             insertPos = selection.to
             editor.chain().focus().insertContentAt(insertPos, '\n').run()
             insertPos += 1
        } else {
             // For fix grammar and improve writing, we replace the selection
             editor.chain().focus().deleteSelection().run()
             insertPos = selection.from
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value, { stream: true })
          // The AI SDK stream format prefixes lines with "0:" for text chunks
          const lines = chunk.split('\n')
          for (const line of lines) {
              if (line.startsWith('0:')) {
                  try {
                      // parse the JSON string chunk
                      const textContent = JSON.parse(line.substring(2))
                      editor.chain().focus().insertContentAt(insertPos, textContent).run()
                      insertPos += textContent.length
                  } catch (e) {
                      // Ignore parse errors on partial chunks
                  }
              }
          }
        }
      }
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)

    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to generate AI response")
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`p-2 rounded-md transition-colors flex items-center justify-center gap-1 text-sm font-medium
          ${isOpen || isLoading ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}
        `}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 
         success ? <CheckCircle2 className="w-4 h-4 text-green-500" /> :
         error ? <AlertCircle className="w-4 h-4 text-red-500" /> :
         <Sparkles className="w-4 h-4 text-indigo-400" />}
        <span>AI</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50 flex flex-col p-1">
          <div className="px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            AI Actions
          </div>
          <button 
            onClick={() => handleAiAction('fix-grammar')}
            className="text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white rounded transition-colors"
          >
            Fix Grammar
          </button>
          <button 
            onClick={() => handleAiAction('improve-writing')}
            className="text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white rounded transition-colors"
          >
            Improve Writing
          </button>
          <button 
            onClick={() => handleAiAction('continue-writing')}
            className="text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white rounded transition-colors"
          >
            Continue Writing
          </button>
          <div className="h-px w-full bg-zinc-800 my-1" />
          <button 
            onClick={() => handleAiAction('summarize')}
            className="text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white rounded transition-colors"
          >
            Summarize Document
          </button>
        </div>
      )}
    </div>
  )
}
