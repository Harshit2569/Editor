import { create } from "zustand"
import { DocumentProvider } from "./document-provider"

export type SyncStatus = "connecting" | "connected" | "disconnected" | "syncing"

interface SyncState {
  status: SyncStatus
  pendingChanges: number
  lastSyncedAt: Date | null
  setStatus: (status: SyncStatus) => void
  setPendingChanges: (count: number) => void
  setLastSyncedAt: (date: Date) => void
}

export const useSyncStore = create<SyncState>((set) => ({
  status: "disconnected",
  pendingChanges: 0,
  lastSyncedAt: null,
  setStatus: (status) => set({ status }),
  setPendingChanges: (count) => set({ pendingChanges: count }),
  setLastSyncedAt: (date) => set({ lastSyncedAt: date }),
}))

export class SyncEngine {
  private provider: DocumentProvider
  private syncTimeout: NodeJS.Timeout | null = null

  constructor(provider: DocumentProvider) {
    this.provider = provider
    this.setupListeners()
  }

  private setupListeners() {
    const store = useSyncStore.getState()
    const { provider, ydoc } = this.provider

    // Listen to network status
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.handleOnline())
      window.addEventListener("offline", () => this.handleOffline())
    }

    // Provider events
    provider.on("status", ({ status }: { status: string }) => {
      if (status === "connected") {
        store.setStatus("connected")
        store.setLastSyncedAt(new Date())
        store.setPendingChanges(0)
      } else if (status === "connecting") {
        store.setStatus("connecting")
      } else {
        store.setStatus("disconnected")
      }
    })

    provider.on("sync", ({ state }: { state: boolean }) => {
      if (state) {
        store.setLastSyncedAt(new Date())
        store.setPendingChanges(0)
      }
    })

    // Track local changes to show "syncing" state
    ydoc.on("update", (update, origin) => {
      if (origin !== provider) {
        // Local change
        store.setPendingChanges(useSyncStore.getState().pendingChanges + 1)
        
        if (store.status === "connected") {
          store.setStatus("syncing")
          
          if (this.syncTimeout) clearTimeout(this.syncTimeout)
          this.syncTimeout = setTimeout(() => {
            if (useSyncStore.getState().status === "syncing") {
              store.setStatus("connected")
              store.setPendingChanges(0)
              store.setLastSyncedAt(new Date())
            }
          }, 500)
        }
      }
    })
  }

  private handleOnline() {
    this.provider.connect()
  }

  private handleOffline() {
    useSyncStore.getState().setStatus("disconnected")
  }
}
