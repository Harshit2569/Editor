# Conflict Resolution Strategy: Yjs CRDTs

This document explains the conflict resolution strategy for the collaborative document editor. We intentionally avoid building a custom, complex conflict resolution algorithm by relying on the mathematical properties of Conflict-free Replicated Data Types (CRDTs).

## Why Yjs?

We use **Yjs**, which is based on the **YATA (Yet Another Transformation Approach)** algorithm.

### Deterministic Convergence

Unlike Operational Transformation (OT) which requires a central server to arbitrate the order of operations, CRDTs guarantee **deterministic convergence**. 

1. **Unique Identity**: Every character/node inserted into the document is assigned a unique identifier consisting of the `client_id` (a unique integer for that session) and a `clock` (a logical timestamp that increments with each operation).
2. **Total Ordering**: When two clients insert text at the exact same position concurrently, Yjs uses the unique IDs to establish a deterministic total order. For example, if Client A (ID: 1) and Client B (ID: 2) both insert a character at position 5, Yjs might dictate that Client B's insertion always goes after Client A's based on the IDs.
3. **No Server Arbitration**: The server acts merely as a dumb relay. It doesn't need to transform operations. It simply receives a binary blob (an update) and forwards it to other clients, or merges it into its own state vector.
4. **Commutative Operations**: Because of the YATA algorithm, updates can be applied in *any order*. Client A might receive updates [X, Y, Z] while Client B receives [Z, X, Y]. Both will compute the exact same final document state.

## How Offline Sync Works

Our architecture utilizes a **Local-First** approach with `y-indexeddb`:

1. **Immediate Local Write**: When a user types while offline, the Yjs document state is immediately persisted to IndexedDB. The UI never blocks waiting for the network.
2. **Reconnection**: When the network connection is restored, the `HocuspocusProvider` connects to the WebSocket server.
3. **State Vector Diffing**: 
   - The client sends its "State Vector" to the server. This is a tiny summary of what the client knows (e.g., "I have Client 1 up to clock 50, Client 2 up to clock 20").
   - The server compares this with its own state vector.
   - The server replies with *only the missing updates*.
   - The client replies with *its missing updates*.
4. **Merging**: The local client and the server merge these missing updates into their respective Yjs documents. Because of CRDT guarantees, both will converge to the same state seamlessly.

There is no custom queueing system, no "last write wins" data loss, and no complicated merge conflicts to resolve manually. The CRDT engine handles it mathematically.
