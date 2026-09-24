import type { SettingsManager } from "@Core/SettingsManager";
import type { Clipboard } from "electron";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ClipboardWatcher } from "./ClipboardWatcher";
import type { ClipboardHistoryRepository } from "./Contract";
import type { ImageFileStore } from "./ImageFileStore";

const buildImageItem = (bytes: number[], type = "image/png") => ({
    types: [type],
    getType: vi.fn().mockResolvedValue(new Blob([new Uint8Array(bytes)], { type })),
});

describe(ClipboardWatcher, () => {
    let clipboard: Clipboard;
    let clipboardHistoryRepository: ClipboardHistoryRepository;
    let imageFileStore: ImageFileStore;
    let settingsManager: SettingsManager;
    let readTextMock: ReturnType<typeof vi.fn>;
    let readMock: ReturnType<typeof vi.fn>;
    let saveImageMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.useFakeTimers();

        readTextMock = vi.fn().mockResolvedValue("");
        readMock = vi.fn().mockResolvedValue([]);
        clipboard = { readText: readTextMock, read: readMock } as unknown as Clipboard;

        clipboardHistoryRepository = { add: vi.fn(), getAll: vi.fn(), delete: vi.fn(), clear: vi.fn() };

        saveImageMock = vi.fn().mockResolvedValue("hash.png");
        imageFileStore = { save: saveImageMock } as unknown as ImageFileStore;

        settingsManager = { getValue: vi.fn().mockReturnValue(300), updateValue: vi.fn() };
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("should add a new clipboard history entry once the polled text differs from the last known value", async () => {
        readTextMock.mockResolvedValue("hello world");

        const watcher = new ClipboardWatcher(
            clipboard,
            clipboardHistoryRepository,
            imageFileStore,
            settingsManager,
            500,
        );
        watcher.start();

        await vi.advanceTimersByTimeAsync(500);

        expect(clipboardHistoryRepository.add).toHaveBeenCalledTimes(1);
        expect(clipboardHistoryRepository.add).toHaveBeenCalledWith(
            expect.objectContaining({ contentType: "text", textContent: "hello world", maxHistorySize: 300 }),
        );
    });

    it("should not add a duplicate entry when the clipboard content has not changed", async () => {
        readTextMock.mockResolvedValue("hello world");

        const watcher = new ClipboardWatcher(
            clipboard,
            clipboardHistoryRepository,
            imageFileStore,
            settingsManager,
            500,
        );
        watcher.start();

        await vi.advanceTimersByTimeAsync(500);
        await vi.advanceTimersByTimeAsync(500);

        expect(clipboardHistoryRepository.add).toHaveBeenCalledTimes(1);
    });

    it("should add a new entry again once the clipboard content changes to something new", async () => {
        readTextMock.mockResolvedValue("first");

        const watcher = new ClipboardWatcher(
            clipboard,
            clipboardHistoryRepository,
            imageFileStore,
            settingsManager,
            500,
        );
        watcher.start();

        await vi.advanceTimersByTimeAsync(500);

        readTextMock.mockResolvedValue("second");

        await vi.advanceTimersByTimeAsync(500);

        expect(clipboardHistoryRepository.add).toHaveBeenCalledTimes(2);
    });

    it("should ignore empty clipboard content", async () => {
        readTextMock.mockResolvedValue("");

        const watcher = new ClipboardWatcher(
            clipboard,
            clipboardHistoryRepository,
            imageFileStore,
            settingsManager,
            500,
        );
        watcher.start();

        await vi.advanceTimersByTimeAsync(500);

        expect(clipboardHistoryRepository.add).not.toHaveBeenCalled();
    });

    it("should stop polling once stop() has been called", async () => {
        readTextMock.mockResolvedValue("hello world");

        const watcher = new ClipboardWatcher(
            clipboard,
            clipboardHistoryRepository,
            imageFileStore,
            settingsManager,
            500,
        );
        watcher.start();
        watcher.stop();

        await vi.advanceTimersByTimeAsync(2000);

        expect(clipboardHistoryRepository.add).not.toHaveBeenCalled();
    });

    it("should save an image to the image file store and add an image entry when the clipboard contains an image", async () => {
        readMock.mockResolvedValue([buildImageItem([1, 2, 3])]);

        const watcher = new ClipboardWatcher(
            clipboard,
            clipboardHistoryRepository,
            imageFileStore,
            settingsManager,
            500,
        );
        watcher.start();

        await vi.advanceTimersByTimeAsync(500);

        expect(saveImageMock).toHaveBeenCalledTimes(1);
        expect(clipboardHistoryRepository.add).toHaveBeenCalledWith(
            expect.objectContaining({ contentType: "image", imageFileName: "hash.png", maxHistorySize: 300 }),
        );
        expect(readTextMock).not.toHaveBeenCalled();
    });

    it("should not save a duplicate image entry when the clipboard image has not changed", async () => {
        readMock.mockResolvedValue([buildImageItem([1, 2, 3])]);

        const watcher = new ClipboardWatcher(
            clipboard,
            clipboardHistoryRepository,
            imageFileStore,
            settingsManager,
            500,
        );
        watcher.start();

        await vi.advanceTimersByTimeAsync(500);
        await vi.advanceTimersByTimeAsync(500);

        expect(clipboardHistoryRepository.add).toHaveBeenCalledTimes(1);
    });

    it("should save a new image entry when the clipboard image changes", async () => {
        readMock.mockResolvedValue([buildImageItem([1, 2, 3])]);

        const watcher = new ClipboardWatcher(
            clipboard,
            clipboardHistoryRepository,
            imageFileStore,
            settingsManager,
            500,
        );
        watcher.start();

        await vi.advanceTimersByTimeAsync(500);

        readMock.mockResolvedValue([buildImageItem([4, 5, 6])]);

        await vi.advanceTimersByTimeAsync(500);

        expect(clipboardHistoryRepository.add).toHaveBeenCalledTimes(2);
    });
});
