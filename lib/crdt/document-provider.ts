import * as Y from "yjs"
import { HocuspocusProvider, HocuspocusProviderWebsocket } from "@hocuspocus/provider"
import { IndexeddbPersistence } from "y-indexeddb"

export class DocumentProvider {
  public ydoc: Y.Doc
  public provider: HocuspocusProvider
  public websocketProvider: HocuspocusProviderWebsocket
  public persistence: IndexeddbPersistence

  constructor(documentId: string, token: string) {
    this.ydoc = new Y.Doc()

    // 1. Local-First: Persist to IndexedDB immediately
    // This allows zero-network editing and survives browser restarts
    this.persistence = new IndexeddbPersistence(documentId, this.ydoc)
    
    // 2. Network Sync: Connect to Hocuspocus server
    // We use a separate port for the WebSocket backend
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || (typeof window !== "undefined" 
      ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.hostname}:1234`
      : "ws://localhost:1234")

    this.websocketProvider = new HocuspocusProviderWebsocket({
      url: wsUrl,
      autoConnect: false, // Don't auto-connect; we connect manually after attaching listeners
    })

    this.provider = new HocuspocusProvider({
      name: documentId,
      document: this.ydoc,
      token, // JWT or session token for authentication
      websocketProvider: this.websocketProvider,
    })

    // Log persistence errors
    this.persistence.on("error", (err: Error) => {
      console.error("IndexedDB persistence error:", err)
    })
  }

  connect() {
    this.websocketProvider.connect()
  }

  disconnect() {
    this.websocketProvider.disconnect()
  }

  destroy() {
    this.provider.destroy()
    this.websocketProvider.disconnect()
    this.ydoc.destroy()
  }
}
