import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { FileSystemUtility } from "@Core/FileSystemUtility";
import type { UeliModuleRegistry } from "@Core/ModuleRegistry";
import type Database from "better-sqlite3";
import type { App } from "electron";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ClipboardManagerDatabaseModule } from "./ClipboardManagerDatabaseModule";

describe(ClipboardManagerDatabaseModule, () => {
    const temporaryDirectories: string[] = [];

    afterEach(() => {
        while (temporaryDirectories.length > 0) {
            rmSync(temporaryDirectories.pop() as string, { recursive: true, force: true });
        }
    });

    it("should create the database file with the clipboard_history and snippets tables and register it", async () => {
        const userDataPath = mkdtempSync(join(tmpdir(), "ueli-clipboard-manager-database-test-"));
        temporaryDirectories.push(userDataPath);

        const app = { getPath: vi.fn().mockReturnValue(userDataPath), on: vi.fn() } as unknown as App;

        const fileSystemUtility = {
            createFolderIfDoesntExist: vi.fn().mockImplementation(async (folderPath: string) => {
                mkdirSync(folderPath, { recursive: true });
            }),
        } as unknown as FileSystemUtility;

        const moduleRegistry = <UeliModuleRegistry>{
            get: vi.fn((key: string) => ({ App: app, FileSystemUtility: fileSystemUtility })[key]),
            register: vi.fn(),
        };

        await ClipboardManagerDatabaseModule.bootstrap(moduleRegistry);

        expect(fileSystemUtility.createFolderIfDoesntExist).toHaveBeenCalledWith(
            join(userDataPath, "ClipboardManager"),
        );

        const registerCall = vi
            .mocked(moduleRegistry.register)
            .mock.calls.find(([key]) => key === "ClipboardManagerDatabase");
        expect(registerCall).toBeDefined();

        const database = registerCall?.[1] as Database.Database;

        const tableNames = database
            .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
            .all()
            .map((row) => (row as { name: string }).name);

        expect(tableNames).toEqual(["clipboard_history", "snippets"]);

        database.close();
    });

    it("should close the database when the app is about to quit", async () => {
        const userDataPath = mkdtempSync(join(tmpdir(), "ueli-clipboard-manager-database-test-"));
        temporaryDirectories.push(userDataPath);

        const app = { getPath: vi.fn().mockReturnValue(userDataPath), on: vi.fn() } as unknown as App;

        const fileSystemUtility = {
            createFolderIfDoesntExist: vi.fn().mockImplementation(async (folderPath: string) => {
                mkdirSync(folderPath, { recursive: true });
            }),
        } as unknown as FileSystemUtility;

        const moduleRegistry = <UeliModuleRegistry>{
            get: vi.fn((key: string) => ({ App: app, FileSystemUtility: fileSystemUtility })[key]),
            register: vi.fn(),
        };

        await ClipboardManagerDatabaseModule.bootstrap(moduleRegistry);

        expect(app.on).toHaveBeenCalledWith("before-quit", expect.any(Function));
    });
});
