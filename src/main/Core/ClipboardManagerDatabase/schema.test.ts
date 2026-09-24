import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";

import { initializeSchema } from "./schema";

describe(initializeSchema, () => {
    it("should create the clipboard_history and snippets tables", () => {
        const database = new Database(":memory:");

        initializeSchema(database);

        const tableNames = database
            .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
            .all()
            .map((row) => (row as { name: string }).name);

        expect(tableNames).toEqual(["clipboard_history", "snippets"]);

        database.close();
    });

    it("should be safe to call twice without throwing", () => {
        const database = new Database(":memory:");

        initializeSchema(database);

        expect(() => initializeSchema(database)).not.toThrow();

        database.close();
    });

    it("should enforce a unique constraint on clipboard_history.content_hash", () => {
        const database = new Database(":memory:");
        initializeSchema(database);

        const insert = database.prepare(`
            INSERT INTO clipboard_history (content_type, text_content, content_hash, preview, created_at, last_used_at)
            VALUES ('text', 'hello', 'hash-1', 'hello', 0, 0)
        `);
        insert.run();

        expect(() => insert.run()).toThrowError();

        database.close();
    });

    it("should reject content_type values other than 'text' or 'image'", () => {
        const database = new Database(":memory:");
        initializeSchema(database);

        expect(() =>
            database
                .prepare(
                    `INSERT INTO clipboard_history (content_type, content_hash, created_at, last_used_at)
                     VALUES ('invalid', 'hash-1', 0, 0)`,
                )
                .run(),
        ).toThrowError();

        database.close();
    });
});
