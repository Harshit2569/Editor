# Local-First Collaborative Document Editor

A sophisticated, highly-performant collaborative text editor showcasing advanced distributed systems patterns including CRDTs, WebSocket-based synchronization, and Local-First persistence.

## 🚀 Key Features

*   **Local-First Architecture**: Powered by `y-indexeddb`. The editor persists all changes to IndexedDB *before* pushing to the network. This guarantees zero-latency typing and full offline capabilities.
*   **Conflict-Free Replicated Data Types (CRDTs)**: Built on **Yjs** (using the YATA algorithm), ensuring deterministic convergence without needing a central arbitration server for conflict resolution.
*   **Real-time Collaboration**: Integrated with **TipTap v2** and **Hocuspocus**. Multi-user cursors, live awareness, and seamless state vector merging.
*   **Intelligent Sync Engine**: A custom orchestrator (`lib/crdt/sync-engine.ts`) manages network transitions, reconnecting dynamically, and merging missing state vectors gracefully when coming back online.
*   **Robust Security & Authorization**: 
    *   **WebSocket Shielding**: The custom Next.js server (`server.ts`) intercepts WebSocket upgrades and queries the database to authenticate and authorize users in real-time *before* allowing the Yjs engine to accept connections.
    *   **Payload Size Limits**: Strict checks on state vector payload sizes (10MB max in PostgreSQL, 1MB max in WebSockets) to prevent malicious OOM attacks.
    *   **Rate Limiting**: Custom in-memory rate limiting utility guarding critical REST API routes.
*   **Granular Version Control**: Advanced version history capable of capturing binary Yjs snapshots into PostgreSQL, allowing users to restore exact editor states.

## 🛠 Tech Stack

*   **Framework**: Next.js 16 (App Router)
*   **CRDT Engine**: Yjs, y-prosemirror, y-websocket, y-indexeddb
*   **Rich Text Editor**: TipTap v2
*   **Collaboration Server**: Hocuspocus (embedded in custom `server.ts`)
*   **Database**: PostgreSQL with Prisma ORM
*   **Authentication**: Auth.js (NextAuth v5)
*   **Styling**: Tailwind CSS 4, Lucide React

## 🔒 Security Model

1.  **Application-Level Multi-Tenancy**: All database queries explicitly scope data retrieval using the user's ID against the `ownerId` and `DocumentRole` tables.
2.  **WebSockets Authentication**: The `onAuthenticate` hook in the Hocuspocus server validates session tokens and explicitly blocks unauthorized access to document streams.
3.  **Rate Limiting**: Applied to `/api/auth/register`, `/api/documents`, and `/api/documents/.../versions` to prevent abuse.

## 🏃‍♂️ Running Locally

1.  **Database Setup**: Start the PostgreSQL database using Docker.
    ```bash
    docker-compose up -d
    ```
2.  **Environment Variables**: Ensure `.env.local` is properly configured.
3.  **Database Push**: Sync the Prisma schema.
    ```bash
    pnpm prisma db push
    ```
4.  **Start the Application**: You MUST use the custom server script to enable WebSocket support.
    ```bash
    pnpm tsx server.ts
    ```
    *Note: Standard `next dev` will not start the Hocuspocus server required for collaboration.*

## 🧪 Testing the Offline Capabilities

1.  Create a document and start typing.
2.  Open your browser's DevTools -> Network -> **Offline**.
3.  Continue typing. Notice there is no lag, and the "Saved" indicator turns to "Offline".
4.  Close the tab, reopen it, and observe that your offline changes are fully preserved via IndexedDB.
5.  Turn the Network back to **Online**.
6.  The app will automatically reconnect via WebSockets, diff the local state vector with the server's state vector, and merge missing updates seamlessly.
