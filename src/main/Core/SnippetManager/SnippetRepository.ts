import type { DateProvider } from "@Core/DateProvider";
import type Database from "better-sqlite3";

import type { Snippet, SnippetRepository as SnippetRepositoryInterface } from "./Contract";

type SnippetRow = {
    id: number;
    name: string;
    content: string;
    use_count: number;
    created_at: number;
    updated_at: number;
};

const toSnippet = (row: SnippetRow): Snippet => {
    return {
        id: row.id,
        name: row.name,
        content: row.content,
        useCount: row.use_count,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
};

export class SnippetRepository implements SnippetRepositoryInterface {
    public constructor(
        private readonly database: Database.Database,
        private readonly dateProvider: DateProvider,
    ) {}

    public add(input: { name: string; content: string }): void {
        const now = this.dateProvider.get().getTime();

        this.database
            .prepare(`
                INSERT INTO snippets (name, content, created_at, updated_at)
                VALUES (?, ?, ?, ?)
            `)
            .run(input.name, input.content, now, now);
    }

    public getAll(): Snippet[] {
        const rows = this.database.prepare("SELECT * FROM snippets ORDER BY updated_at DESC").all() as SnippetRow[];

        return rows.map(toSnippet);
    }

    public delete(id: number): void {
        this.database.prepare("DELETE FROM snippets WHERE id = ?").run(id);
    }

    public incrementUsage(id: number): void {
        const now = this.dateProvider.get().getTime();

        this.database
            .prepare("UPDATE snippets SET use_count = use_count + 1, updated_at = ? WHERE id = ?")
            .run(now, id);
    }
}
