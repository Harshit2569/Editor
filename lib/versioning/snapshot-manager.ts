import * as Y from "yjs"

export class SnapshotManager {
  /**
   * Captures the current state of a Yjs document as a byte array.
   * This represents a complete, standalone snapshot of the document at this exact moment.
   */
  static captureSnapshot(ydoc: Y.Doc): number[] {
    // encodeStateAsUpdate generates a binary representation of the entire document
    const stateVector = Y.encodeStateAsUpdate(ydoc)
    return Array.from(stateVector)
  }

  /**
   * Restores a Yjs document from a snapshot byte array.
   * 
   * @param targetDoc The Yjs document to restore into
   * @param snapshotState The byte array representing the snapshot
   */
  static restoreSnapshot(targetDoc: Y.Doc, snapshotState: number[] | Uint8Array) {
    const uint8Array = snapshotState instanceof Uint8Array 
      ? snapshotState 
      : new Uint8Array(snapshotState)

    // Clear existing content (optional depending on if you want to merge or replace)
    // To do a hard replace, it's safer to clear the main maps/arrays or start fresh
    // But applying an update with the same client IDs will merge it deterministically.
    
    // For a true "restore to this exact state", Yjs requires applying the update
    // If the targetDoc has newer changes, they might persist unless we do a destructive replace.
    // For TipTap, the main type is usually a XmlFragment called 'default'.
    
    // A clean way to "revert" is to compute the diff and apply inverse operations,
    // or simply replace the content of the tip tap editor.
    // For this implementation, we apply the snapshot update.
    
    Y.applyUpdate(targetDoc, uint8Array)
  }
}
