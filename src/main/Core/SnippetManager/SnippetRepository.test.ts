import type { DateProvider } from "@Core/DateProvider";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { initializeSchema } from "../ClipboardManagerDatabase/schema";
import { SnippetRepository } from "./SnippetRepository";

describe(SnippetRepository, () => {
    let database: Database.Database;
    let now: number;
    let dateProvider: DateProvider;
    let repository: SnippetRepository;

    beforeEach(() => {
        database = new Database(":memory:");
        initializeSchema(database);

        now = 1000;
        dateProvider = { get: vi.fn(() => new Date(now)) };

        repository = new SnippetRepository(database, dateProvider);
    });

    afterEach(() => {
        database.close();
    });

    describe(SnippetRepository.prototype.add, () => {
        it("should insert a new snippet", () => {
            repository.add({ name: "greeting", content: "Hello there" });

            const snippets = repository.getAll();

            expect(snippets).toHaveLength(1);
            expect(snippets[0]).toMatchObject({
                name: "greeting",
                content: "Hello there",
                useCount: 0,
                createdAt: 1000,
                updatedAt: 1000,
            });
        });
    });

    describe(SnippetRepository.prototype.getAll, () => {
        it("should return snippets ordered by most recently updated first", () => {
            repository.add({ name: "first", content: "one" });

            now = 2000;
            repository.add({ name: "second", content: "two" });

            expect(repository.getAll().map((snippet) => snippet.name)).toEqual(["second", "first"]);
        });
    });

    describe(SnippetRepository.prototype.delete, () => {
        it("should remove the snippet with the given id", () => {
            repository.add({ name: "greeting", content: "Hello there" });

            const [snippet] = repository.getAll();

            repository.delete(snippet.id);

            expect(repository.getAll()).toHaveLength(0);
        });
    });

    describe(SnippetRepository.prototype.incrementUsage, () => {
        it("should increment the use count and update the updatedAt timestamp", () => {
            repository.add({ name: "greeting", content: "Hello there" });
            const [snippet] = repository.getAll();

            now = 2000;
            repository.incrementUsage(snippet.id);

            const [updated] = repository.getAll();
            expect(updated).toMatchObject({ useCount: 1, updatedAt: 2000 });
        });
    });
});
