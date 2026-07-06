// Re-export types from Yjs and Hocuspocus for awareness
import { HocuspocusProvider } from "@hocuspocus/provider"

export interface UserAwareness {
  name: string
  color: string
  // Cursor position is handled internally by y-prosemirror
}

export function setupAwareness(provider: HocuspocusProvider, user: UserAwareness) {
  provider.setAwarenessField("user", user)
  
  return provider.awareness
}

export const USER_COLORS = [
  "#f87171", // red-400
  "#fb923c", // orange-400
  "#fbbf24", // amber-400
  "#a3e635", // lime-400
  "#4ade80", // green-400
  "#34d399", // emerald-400
  "#2dd4bf", // teal-400
  "#38bdf8", // sky-400
  "#60a5fa", // blue-400
  "#818cf8", // indigo-400
  "#a78bfa", // violet-400
  "#c084fc", // purple-400
  "#e879f9", // fuchsia-400
  "#f472b6", // pink-400
  "#fb7185", // rose-400
]

export function getRandomColor(seed?: string) {
  if (seed) {
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % USER_COLORS.length
    return USER_COLORS[index]
  }
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]
}
