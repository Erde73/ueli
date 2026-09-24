import type Database from "better-sqlite3";

export const initializeSchema = (database: Database.Database): void => {
    database.exec(`
        CREATE TABLE IF NOT EXISTS clipboard_history (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            content_type    TEXT    NOT NULL CHECK (content_type IN ('text', 'image')),
            text_content    TEXT,
            image_file_name TEXT,
            content_hash    TEXT    NOT NULL,
            preview         TEXT,
            use_count       INTEGER NOT NULL DEFAULT 1,
            pinned          INTEGER NOT NULL DEFAULT 0,
            created_at      INTEGER NOT NULL,
            last_used_at    INTEGER NOT NULL
        );

        CREATE UNIQUE INDEX IF NOT EXISTS idx_clipboard_history_content_hash ON clipboard_history(content_hash);
        CREATE INDEX IF NOT EXISTS idx_clipboard_history_last_used_at ON clipboard_history(last_used_at DESC);

        CREATE TABLE IF NOT EXISTS snippets (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            name       TEXT    NOT NULL,
            content    TEXT    NOT NULL,
            use_count  INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );
    `);
};
