import type { DateProvider } from "@Core/DateProvider";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { initializeSchema } from "../ClipboardManagerDatabase/schema";
import { ClipboardHistoryRepository } from "./ClipboardHistoryRepository";

describe(ClipboardHistoryRepository, () => {
    let database: Database.Database;
    let now: number;
    let dateProvider: DateProvider;
    let repository: ClipboardHistoryRepository;

    beforeEach(() => {
        database = new Database(":memory:");
        initializeSchema(database);

        now = 1000;
        dateProvider = { get: vi.fn(() => new Date(now)) };

        repository = new ClipboardHistoryRepository(database, dateProvider);
    });

    afterEach(() => {
        database.close();
    });

    describe(ClipboardHistoryRepository.prototype.add, () => {
        it("should insert a new text entry", () => {
            repository.add({
                contentType: "text",
                textContent: "hello world",
                contentHash: "hash-1",
                preview: "hello world",
                maxHistorySize: 100,
            });

            const entries = repository.getAll();

            expect(entries).toHaveLength(1);
            expect(entries[0]).toMatchObject({
                contentType: "text",
                textContent: "hello world",
                preview: "hello world",
                useCount: 1,
                pinned: false,
                createdAt: 1000,
                lastUsedAt: 1000,
            });
        });

        it("should not create a duplicate row when the same content hash is added again, and should bump use count and last used timestamp instead", () => {
            repository.add({
                contentType: "text",
                textContent: "hello world",
                contentHash: "hash-1",
                preview: "hello world",
                maxHistorySize: 100,
            });

            now = 2000;

            repository.add({
                contentType: "text",
                textContent: "hello world",
                contentHash: "hash-1",
                preview: "hello world",
                maxHistorySize: 100,
            });

            const entries = repository.getAll();

            expect(entries).toHaveLength(1);
            expect(entries[0]).toMatchObject({ useCount: 2, createdAt: 1000, lastUsedAt: 2000 });
        });

        it("should remove the least recently used unpinned entries once maxHistorySize is exceeded", () => {
            for (let i = 0; i < 3; i++) {
                now = 1000 + i;
                repository.add({
                    contentType: "text",
                    textContent: `entry-${i}`,
                    contentHash: `hash-${i}`,
                    preview: `entry-${i}`,
                    maxHistorySize: 2,
                });
            }

            const entries = repository.getAll();

            expect(entries).toHaveLength(2);
            expect(entries.map((entry) => entry.textContent)).toEqual(["entry-2", "entry-1"]);
        });
    });

    describe(ClipboardHistoryRepository.prototype.getAll, () => {
        it("should return entries ordered by most recently used first", () => {
            repository.add({
                contentType: "text",
                textContent: "first",
                contentHash: "hash-1",
                preview: "first",
                maxHistorySize: 100,
            });

            now = 2000;

            repository.add({
                contentType: "text",
                textContent: "second",
                contentHash: "hash-2",
                preview: "second",
                maxHistorySize: 100,
            });

            expect(repository.getAll().map((entry) => entry.textContent)).toEqual(["second", "first"]);
        });
    });

    describe(ClipboardHistoryRepository.prototype.delete, () => {
        it("should remove the entry with the given id", () => {
            repository.add({
                contentType: "text",
                textContent: "hello world",
                contentHash: "hash-1",
                preview: "hello world",
                maxHistorySize: 100,
            });

            const [entry] = repository.getAll();

            repository.delete(entry.id);

            expect(repository.getAll()).toHaveLength(0);
        });
    });

    describe(ClipboardHistoryRepository.prototype.clear, () => {
        it("should remove all entries", () => {
            repository.add({
                contentType: "text",
                textContent: "one",
                contentHash: "hash-1",
                preview: "one",
                maxHistorySize: 100,
            });
            repository.add({
                contentType: "text",
                textContent: "two",
                contentHash: "hash-2",
                preview: "two",
                maxHistorySize: 100,
            });

            repository.clear();

            expect(repository.getAll()).toHaveLength(0);
        });
    });
});
