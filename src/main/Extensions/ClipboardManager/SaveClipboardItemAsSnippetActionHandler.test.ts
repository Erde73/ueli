import type { SearchResultItemAction } from "@common/Core";
import type { ClipboardHistoryEntry, ClipboardHistoryRepository } from "@Core/ClipboardHistory";
import type { SnippetRepository } from "@Core/SnippetManager";
import { describe, expect, it, vi } from "vitest";

import { SaveClipboardItemAsSnippetActionHandler } from "./SaveClipboardItemAsSnippetActionHandler";

const makeEntry = (overrides: Partial<ClipboardHistoryEntry> = {}): ClipboardHistoryEntry => {
    return {
        id: 1,
        contentType: "text",
        textContent: "hello world",
        imageFileName: null,
        preview: "hello world",
        useCount: 1,
        pinned: false,
        createdAt: 1000,
        lastUsedAt: 1000,
        ...overrides,
    };
};

describe(SaveClipboardItemAsSnippetActionHandler, () => {
    describe(SaveClipboardItemAsSnippetActionHandler.prototype.id, () =>
        it(`should be "saveClipboardItemAsSnippet"`, () => {
            const clipboardHistoryRepository = {
                getAll: vi.fn().mockReturnValue([]),
            } as unknown as ClipboardHistoryRepository;
            const snippetRepository = { add: vi.fn() } as unknown as SnippetRepository;
            expect(new SaveClipboardItemAsSnippetActionHandler(clipboardHistoryRepository, snippetRepository).id).toBe(
                "saveClipboardItemAsSnippet",
            );
        }),
    );

    describe(SaveClipboardItemAsSnippetActionHandler.prototype.invokeAction, () => {
        it("should save the text content of the matching history entry as a new snippet", async () => {
            const clipboardHistoryRepository = {
                getAll: vi
                    .fn()
                    .mockReturnValue([makeEntry({ id: 42, textContent: "hello world", preview: "hello world" })]),
            } as unknown as ClipboardHistoryRepository;
            const snippetRepository = { add: vi.fn() } as unknown as SnippetRepository;

            await new SaveClipboardItemAsSnippetActionHandler(
                clipboardHistoryRepository,
                snippetRepository,
            ).invokeAction(<SearchResultItemAction>{ argument: "42" });

            expect(snippetRepository.add).toHaveBeenCalledWith({ name: "hello world", content: "hello world" });
        });

        it("should do nothing when no matching history entry is found", async () => {
            const clipboardHistoryRepository = {
                getAll: vi.fn().mockReturnValue([]),
            } as unknown as ClipboardHistoryRepository;
            const snippetRepository = { add: vi.fn() } as unknown as SnippetRepository;

            await new SaveClipboardItemAsSnippetActionHandler(
                clipboardHistoryRepository,
                snippetRepository,
            ).invokeAction(<SearchResultItemAction>{ argument: "42" });

            expect(snippetRepository.add).not.toHaveBeenCalled();
        });

        it("should do nothing when the matching entry is an image", async () => {
            const clipboardHistoryRepository = {
                getAll: vi
                    .fn()
                    .mockReturnValue([
                        makeEntry({ id: 42, contentType: "image", textContent: null, imageFileName: "abc.png" }),
                    ]),
            } as unknown as ClipboardHistoryRepository;
            const snippetRepository = { add: vi.fn() } as unknown as SnippetRepository;

            await new SaveClipboardItemAsSnippetActionHandler(
                clipboardHistoryRepository,
                snippetRepository,
            ).invokeAction(<SearchResultItemAction>{ argument: "42" });

            expect(snippetRepository.add).not.toHaveBeenCalled();
        });
    });
});
