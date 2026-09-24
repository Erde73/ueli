import { join } from "node:path";

import type { UeliModuleRegistry } from "@Core/ModuleRegistry";
import Database from "better-sqlite3";

import { initializeSchema } from "./schema";

export class ClipboardManagerDatabaseModule {
    public static async bootstrap(moduleRegistry: UeliModuleRegistry) {
        const app = moduleRegistry.get("App");
        const fileSystemUtility = moduleRegistry.get("FileSystemUtility");

        const folderPath = join(app.getPath("userData"), "ClipboardManager");
        await fileSystemUtility.createFolderIfDoesntExist(folderPath);

        const database = new Database(join(folderPath, "clipboard-manager.db"));
        initializeSchema(database);

        moduleRegistry.register("ClipboardManagerDatabase", database);

        app.on("before-quit", () => database.close());
    }
}
