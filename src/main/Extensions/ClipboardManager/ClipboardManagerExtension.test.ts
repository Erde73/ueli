import { join } from "node:path";

import type { AssetPathResolver } from "@Core/AssetPathResolver";
import type { ClipboardHistoryEntry, ClipboardHistoryRepository } from "@Core/ClipboardHistory";
import type { SettingsManager } from "@Core/SettingsManager";
import type { Snippet, SnippetRepository } from "@Core/SnippetManager";
import type { Translator } from "@Core/Translator";
import { describe, expect, it, vi } from "vitest";

import { ClipboardManagerExtension } from "./ClipboardManagerExtension";

const createExtension = ({
    operatingSystem = "macOS",
    assetPathResolver = <AssetPathResolver>{ getExtensionAssetPath: vi.fn(), getModuleAssetPath: vi.fn() },
    settingsManager = <SettingsManager>{
        getValue: vi.fn((_key: string, defaultValue: unknown) => defaultValue),
        updateValue: vi.fn(),
    },
    translator = <Translator>{ createT: vi.fn(() => ({ t: (key: string) => key })) },
    clipboardHistoryRepository = <ClipboardHistoryRepository>{
        getAll: vi.fn().mockReturnValue([]),
        add: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
    },
    snippetRepository = <SnippetRepository>{
        getAll: vi.fn().mockReturnValue([]),
        add: vi.fn(),
        delete: vi.fn(),
        incrementUsage: vi.fn(),
    },
    imagesFolderPath = "/images",
}: {
    operatingSystem?: "macOS" | "Windows" | "Linux";
    assetPathResolver?: AssetPathResolver;
    settingsManager?: SettingsManager;
    translator?: Translator;
    clipboardHistoryRepository?: ClipboardHistoryRepository;
    snippetRepository?: SnippetRepository;
    imagesFolderPath?: string;
} = {}) => {
    return new ClipboardManagerExtension(
        operatingSystem,
        assetPathResolver,
        settingsManager,
        translator,
        clipboardHistoryRepository,
        snippetRepository,
        imagesFolderPath,
    );
};

const makeSnippet = (overrides: Partial<Snippet> = {}): Snippet => {
    return {
        id: 1,
        name: "greeting",
        content: "Hello there",
        useCount: 0,
        createdAt: 1000,
        updatedAt: 1000,
        ...overrides,
    };
};

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

describe(ClipboardManagerExtension, () => {
    describe(ClipboardManagerExtension.prototype.id, () =>
        it(`should be "ClipboardManager"`, () => expect(createExtension().id).toBe("ClipboardManager")),
    );

    describe(ClipboardManagerExtension.prototype.isSupported, () => {
        it("should return true for macOS", () =>
            expect(createExtension({ operatingSystem: "macOS" }).isSupported()).toBe(true));
        it("should return false for Windows", () =>
            expect(createExtension({ operatingSystem: "Windows" }).isSupported()).toBe(false));
        it("should return false for Linux", () =>
            expect(createExtension({ operatingSystem: "Linux" }).isSupported()).toBe(false));
    });

    describe(ClipboardManagerExtension.prototype.getSearchResultItems, () =>
        it("should return an empty array", async () =>
            expect(await createExtension().getSearchResultItems()).toEqual([])),
    );

    describe(ClipboardManagerExtension.prototype.getSettingDefaultValue, () => {
        it(`should return "clip" for the prefix setting`, () =>
            expect(createExtension().getSettingDefaultValue("prefix")).toBe("clip"));

        it("should return 300 for the maxHistorySize setting", () =>
            expect(createExtension().getSettingDefaultValue("maxHistorySize")).toBe(300));

        it(`should return "snip" for the snippetPrefix setting`, () =>
            expect(createExtension().getSettingDefaultValue("snippetPrefix")).toBe("snip"));

        it("should return 150 for the autoPasteDelayMs setting", () =>
            expect(createExtension().getSettingDefaultValue("autoPasteDelayMs")).toBe(150));
    });

    describe(ClipboardManagerExtension.prototype.getInstantSearchResultItems, () => {
        it("should return an empty result when the search term does not start with the prefix", () => {
            const result = createExtension().getInstantSearchResultItems("something else");
            expect(result).toEqual({ before: [], after: [] });
        });

        it("should return all history entries when the search term is just the prefix", () => {
            const clipboardHistoryRepository = <ClipboardHistoryRepository>{
                getAll: vi
                    .fn()
                    .mockReturnValue([makeEntry({ id: 1, preview: "first" }), makeEntry({ id: 2, preview: "second" })]),
                add: vi.fn(),
                delete: vi.fn(),
                clear: vi.fn(),
            };

            const result = createExtension({ clipboardHistoryRepository }).getInstantSearchResultItems("clip");

            expect(result.after).toHaveLength(2);
            expect(result.after.map((item) => item.name)).toEqual(["first", "second"]);
        });

        it("should filter history entries by the search term after the prefix", () => {
            const clipboardHistoryRepository = <ClipboardHistoryRepository>{
                getAll: vi
                    .fn()
                    .mockReturnValue([
                        makeEntry({ id: 1, preview: "apple pie" }),
                        makeEntry({ id: 2, preview: "banana bread" }),
                    ]),
                add: vi.fn(),
                delete: vi.fn(),
                clear: vi.fn(),
            };

            const result = createExtension({ clipboardHistoryRepository }).getInstantSearchResultItems("clip apple");

            expect(result.after.map((item) => item.name)).toEqual(["apple pie"]);
        });

        it("should build a defaultAction that pastes the entry's text content into the active app", () => {
            const clipboardHistoryRepository = <ClipboardHistoryRepository>{
                getAll: vi.fn().mockReturnValue([makeEntry({ id: 42, textContent: "paste me", preview: "paste me" })]),
                add: vi.fn(),
                delete: vi.fn(),
                clear: vi.fn(),
            };

            const result = createExtension({ clipboardHistoryRepository }).getInstantSearchResultItems("clip");

            expect(result.after[0].defaultAction).toMatchObject({
                handlerId: "pasteToActiveApp",
                argument: JSON.stringify({ type: "text", text: "paste me" }),
            });
        });

        it("should include a copy-only action in additionalActions", () => {
            const clipboardHistoryRepository = <ClipboardHistoryRepository>{
                getAll: vi.fn().mockReturnValue([makeEntry({ id: 42, textContent: "copy me" })]),
                add: vi.fn(),
                delete: vi.fn(),
                clear: vi.fn(),
            };

            const result = createExtension({ clipboardHistoryRepository }).getInstantSearchResultItems("clip");

            expect(result.after[0].additionalActions).toContainEqual(
                expect.objectContaining({ handlerId: "copyToClipboard", argument: "copy me" }),
            );
        });

        it("should build a defaultAction that pastes an image entry's file into the active app", () => {
            const clipboardHistoryRepository = <ClipboardHistoryRepository>{
                getAll: vi
                    .fn()
                    .mockReturnValue([
                        makeEntry({ id: 42, contentType: "image", textContent: null, imageFileName: "abc.png" }),
                    ]),
                add: vi.fn(),
                delete: vi.fn(),
                clear: vi.fn(),
            };

            const result = createExtension({
                clipboardHistoryRepository,
                imagesFolderPath: "/images",
            }).getInstantSearchResultItems("clip");

            expect(result.after[0].defaultAction).toMatchObject({
                handlerId: "pasteToActiveApp",
                argument: JSON.stringify({ type: "image", imageFilePath: join("/images", "abc.png") }),
            });
        });

        it("should include a copy-only action for an image entry that targets the copyImageToClipboard handler", () => {
            const clipboardHistoryRepository = <ClipboardHistoryRepository>{
                getAll: vi
                    .fn()
                    .mockReturnValue([
                        makeEntry({ id: 42, contentType: "image", textContent: null, imageFileName: "abc.png" }),
                    ]),
                add: vi.fn(),
                delete: vi.fn(),
                clear: vi.fn(),
            };

            const result = createExtension({ clipboardHistoryRepository }).getInstantSearchResultItems("clip");

            expect(result.after[0].additionalActions).toContainEqual(
                expect.objectContaining({ handlerId: "copyImageToClipboard", argument: "abc.png" }),
            );
        });

        it("should include a delete action for each entry that targets the entry's id", () => {
            const clipboardHistoryRepository = <ClipboardHistoryRepository>{
                getAll: vi.fn().mockReturnValue([makeEntry({ id: 42 })]),
                add: vi.fn(),
                delete: vi.fn(),
                clear: vi.fn(),
            };

            const result = createExtension({ clipboardHistoryRepository }).getInstantSearchResultItems("clip");

            expect(result.after[0].additionalActions).toContainEqual(
                expect.objectContaining({ handlerId: "deleteClipboardHistoryItem", argument: "42" }),
            );
        });

        it("should include a save-as-snippet action for each history entry that targets the entry's id", () => {
            const clipboardHistoryRepository = <ClipboardHistoryRepository>{
                getAll: vi.fn().mockReturnValue([makeEntry({ id: 42 })]),
                add: vi.fn(),
                delete: vi.fn(),
                clear: vi.fn(),
            };

            const result = createExtension({ clipboardHistoryRepository }).getInstantSearchResultItems("clip");

            expect(result.after[0].additionalActions).toContainEqual(
                expect.objectContaining({ handlerId: "saveClipboardItemAsSnippet", argument: "42" }),
            );
        });

        it("should return an empty result for the snippet prefix when there is no snippet repository match", () => {
            const result = createExtension().getInstantSearchResultItems("unrelated");
            expect(result).toEqual({ before: [], after: [] });
        });

        it("should return all snippets when the search term is just the snippet prefix", () => {
            const snippetRepository = <SnippetRepository>{
                getAll: vi
                    .fn()
                    .mockReturnValue([makeSnippet({ id: 1, name: "first" }), makeSnippet({ id: 2, name: "second" })]),
                add: vi.fn(),
                delete: vi.fn(),
                incrementUsage: vi.fn(),
            };

            const result = createExtension({ snippetRepository }).getInstantSearchResultItems("snip");

            expect(result.after).toHaveLength(2);
            expect(result.after.map((item) => item.name)).toEqual(["first", "second"]);
        });

        it("should filter snippets by the search term after the snippet prefix", () => {
            const snippetRepository = <SnippetRepository>{
                getAll: vi
                    .fn()
                    .mockReturnValue([makeSnippet({ id: 1, name: "apple" }), makeSnippet({ id: 2, name: "banana" })]),
                add: vi.fn(),
                delete: vi.fn(),
                incrementUsage: vi.fn(),
            };

            const result = createExtension({ snippetRepository }).getInstantSearchResultItems("snip apple");

            expect(result.after.map((item) => item.name)).toEqual(["apple"]);
        });

        it("should build a defaultAction that pastes the snippet's content into the active app", () => {
            const snippetRepository = <SnippetRepository>{
                getAll: vi.fn().mockReturnValue([makeSnippet({ id: 1, content: "Best regards" })]),
                add: vi.fn(),
                delete: vi.fn(),
                incrementUsage: vi.fn(),
            };

            const result = createExtension({ snippetRepository }).getInstantSearchResultItems("snip");

            expect(result.after[0].defaultAction).toMatchObject({
                handlerId: "pasteToActiveApp",
                argument: JSON.stringify({ type: "text", text: "Best regards" }),
            });
        });

        it("should include a delete action for each snippet that targets the snippet's id", () => {
            const snippetRepository = <SnippetRepository>{
                getAll: vi.fn().mockReturnValue([makeSnippet({ id: 7 })]),
                add: vi.fn(),
                delete: vi.fn(),
                incrementUsage: vi.fn(),
            };

            const result = createExtension({ snippetRepository }).getInstantSearchResultItems("snip");

            expect(result.after[0].additionalActions).toContainEqual(
                expect.objectContaining({ handlerId: "deleteSnippet", argument: "7" }),
            );
        });
    });
});
