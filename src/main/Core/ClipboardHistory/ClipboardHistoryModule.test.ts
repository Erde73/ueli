import type { FileSystemUtility } from "@Core/FileSystemUtility";
import type { UeliModuleRegistry } from "@Core/ModuleRegistry";
import Database from "better-sqlite3";
import type { App, Clipboard } from "electron";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { initializeSchema } from "../ClipboardManagerDatabase/schema";
import { ClipboardHistoryModule } from "./ClipboardHistoryModule";
import { ClipboardHistoryRepository } from "./ClipboardHistoryRepository";

describe(ClipboardHistoryModule, () => {
    let database: Database.Database;

    beforeEach(() => {
        vi.useFakeTimers();
        database = new Database(":memory:");
        initializeSchema(database);
    });

    afterEach(() => {
        database.close();
        vi.useRealTimers();
    });

    it("should register a ClipboardHistoryRepository and start polling the clipboard", async () => {
        const dateProvider = { get: () => new Date(1000) };
        const readTextMock = vi.fn().mockResolvedValue("hello world");
        const readMock = vi.fn().mockResolvedValue([]);
        const clipboard = { readText: readTextMock, read: readMock } as unknown as Clipboard;
        const settingsManager = { getValue: vi.fn().mockReturnValue(300), updateValue: vi.fn() };
        const app = { getPath: vi.fn().mockReturnValue("/tmp/ueli-test-user-data") } as unknown as App;
        const fileSystemUtility = {
            createFolderIfDoesntExist: vi.fn().mockResolvedValue(undefined),
        } as unknown as FileSystemUtility;

        const moduleRegistry = {
            get: vi.fn(
                (key: string) =>
                    ({
                        ClipboardManagerDatabase: database,
                        DateProvider: dateProvider,
                        Clipboard: clipboard,
                        SettingsManager: settingsManager,
                        App: app,
                        FileSystemUtility: fileSystemUtility,
                    })[key],
            ),
            register: vi.fn(),
        } as unknown as UeliModuleRegistry;

        await ClipboardHistoryModule.bootstrap(moduleRegistry);

        expect(fileSystemUtility.createFolderIfDoesntExist).toHaveBeenCalled();

        expect(moduleRegistry.register).toHaveBeenCalledWith(
            "ClipboardHistoryRepository",
            expect.any(ClipboardHistoryRepository),
        );

        await vi.advanceTimersByTimeAsync(500);

        expect(readTextMock).toHaveBeenCalled();

        const [, repository] = vi.mocked(moduleRegistry.register).mock.calls[0];
        expect((repository as ClipboardHistoryRepository).getAll()).toHaveLength(1);
    });
});
