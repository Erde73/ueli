import { join } from "node:path";

import type { UeliModuleRegistry } from "@Core/ModuleRegistry";

import { ClipboardHistoryRepository } from "./ClipboardHistoryRepository";
import { ClipboardWatcher } from "./ClipboardWatcher";
import { ImageFileStore } from "./ImageFileStore";

const POLLING_INTERVAL_MS = 500;

export class ClipboardHistoryModule {
    public static async bootstrap(moduleRegistry: UeliModuleRegistry) {
        const database = moduleRegistry.get("ClipboardManagerDatabase");
        const dateProvider = moduleRegistry.get("DateProvider");
        const clipboard = moduleRegistry.get("Clipboard");
        const settingsManager = moduleRegistry.get("SettingsManager");
        const app = moduleRegistry.get("App");
        const fileSystemUtility = moduleRegistry.get("FileSystemUtility");

        const clipboardHistoryRepository = new ClipboardHistoryRepository(database, dateProvider);

        moduleRegistry.register("ClipboardHistoryRepository", clipboardHistoryRepository);

        const imagesFolderPath = join(app.getPath("userData"), "ClipboardManager", "images");
        await fileSystemUtility.createFolderIfDoesntExist(imagesFolderPath);

        moduleRegistry.register("ClipboardImagesFolderPath", imagesFolderPath);

        const imageFileStore = new ImageFileStore(fileSystemUtility, imagesFolderPath);

        const clipboardWatcher = new ClipboardWatcher(
            clipboard,
            clipboardHistoryRepository,
            imageFileStore,
            settingsManager,
            POLLING_INTERVAL_MS,
        );

        clipboardWatcher.start();
    }
}
