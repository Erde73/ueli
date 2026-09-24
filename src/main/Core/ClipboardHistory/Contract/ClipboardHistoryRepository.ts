import type { ClipboardHistoryContentType, ClipboardHistoryEntry } from "./ClipboardHistoryEntry";

export type AddClipboardHistoryEntryInput = {
    contentType: ClipboardHistoryContentType;
    textContent?: string;
    imageFileName?: string;
    contentHash: string;
    preview: string;
    maxHistorySize: number;
};

export interface ClipboardHistoryRepository {
    /**
     * Adds a new clipboard history entry, or, if an entry with the same content hash already exists, updates its
     * usage count and last used timestamp instead of creating a duplicate. If the total number of entries exceeds
     * `maxHistorySize` afterwards, the least recently used unpinned entries are removed.
     */
    add(input: AddClipboardHistoryEntryInput): void;

    /**
     * Returns all clipboard history entries, ordered by most recently used first.
     */
    getAll(): ClipboardHistoryEntry[];

    /**
     * Deletes a single clipboard history entry by id.
     */
    delete(id: number): void;

    /**
     * Deletes all clipboard history entries.
     */
    clear(): void;
}
