import type { UeliModuleRegistry } from "@Core/ModuleRegistry";

import { SnippetRepository } from "./SnippetRepository";

export class SnippetManagerModule {
    public static bootstrap(moduleRegistry: UeliModuleRegistry) {
        const database = moduleRegistry.get("ClipboardManagerDatabase");
        const dateProvider = moduleRegistry.get("DateProvider");

        moduleRegistry.register("SnippetRepository", new SnippetRepository(database, dateProvider));
    }
}
