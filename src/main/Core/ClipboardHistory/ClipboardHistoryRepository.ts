import type { DateProvider } from "@Core/DateProvider";
import type Database from "better-sqlite3";

import type {
    AddClipboardHistoryEntryInput,
    ClipboardHistoryEntry,
    ClipboardHistoryRepository as ClipboardHistoryRepositoryInterface,
} from "./Contract";

type ClipboardHistoryRow = {
    id: number;
    content_type: "text" | "image";
    text_content: string | null;
    image_file_name: string | null;
    preview: string;
    use_count: number;
    pinned: number;
    created_at: number;
    last_used_at: number;
};

const toEntry = (row: ClipboardHistoryRow): ClipboardHistoryEntry => {
    return {
        id: row.id,
        contentType: row.content_type,
        textContent: row.text_content,
        imageFileName: row.image_file_name,
        preview: row.preview,
        useCount: row.use_count,
        pinned: row.pinned === 1,
        createdAt: row.created_at,
        lastUsedAt: row.last_used_at,
    };
};

export class ClipboardHistoryRepository implements ClipboardHistoryRepositoryInterface {
    public constructor(
        private readonly database: Database.Database,
        private readonly dateProvider: DateProvider,
    ) {}

    public add(input: AddClipboardHistoryEntryInput): void {
        const now = this.dateProvider.get().getTime();

        const existing = this.database
            .prepare("SELECT id FROM clipboard_history WHERE content_hash = ?")
            .get(input.contentHash) as { id: number } | undefined;

        if (existing) {
            this.database
                .prepare("UPDATE clipboard_history SET use_count = use_count + 1, last_used_at = ? WHERE id = ?")
                .run(now, existing.id);
        } else {
            this.database
                .prepare(`
                    INSERT INTO clipboard_history
                        (content_type, text_content, image_file_name, content_hash, preview, created_at, last_used_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `)
                .run(
                    input.contentType,
                    input.textContent ?? null,
                    input.imageFileName ?? null,
                    input.contentHash,
                    input.preview,
                    now,
                    now,
                );
        }

        this.evictLeastRecentlyUsed(input.maxHistorySize);
    }

    public getAll(): ClipboardHistoryEntry[] {
        const rows = this.database
            .prepare("SELECT * FROM clipboard_history ORDER BY last_used_at DESC")
            .all() as ClipboardHistoryRow[];

        return rows.map(toEntry);
    }

    public delete(id: number): void {
        this.database.prepare("DELETE FROM clipboard_history WHERE id = ?").run(id);
    }

    public clear(): void {
        this.database.prepare("DELETE FROM clipboard_history").run();
    }

    private evictLeastRecentlyUsed(maxHistorySize: number): void {
        const { count } = this.database.prepare("SELECT COUNT(*) AS count FROM clipboard_history").get() as {
            count: number;
        };

        const overflow = count - maxHistorySize;

        if (overflow > 0) {
            this.database
                .prepare(`
                    DELETE FROM clipboard_history
                    WHERE id IN (
                        SELECT id FROM clipboard_history
                        WHERE pinned = 0
                        ORDER BY last_used_at ASC
                        LIMIT ?
                    )
                `)
                .run(overflow);
        }
    }
}
