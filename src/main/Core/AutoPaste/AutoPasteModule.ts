import type { UeliModuleRegistry } from "@Core/ModuleRegistry";

import { PasteToActiveAppActionHandler } from "./PasteToActiveAppActionHandler";

export class AutoPasteModule {
    public static bootstrap(moduleRegistry: UeliModuleRegistry) {
        const clipboard = moduleRegistry.get("Clipboard");
        const appleScriptUtility = moduleRegistry.get("AppleScriptUtility");
        const systemPreferences = moduleRegistry.get("SystemPreferences");
        const settingsManager = moduleRegistry.get("SettingsManager");
        const fileSystemUtility = moduleRegistry.get("FileSystemUtility");
        const clipboardItemConstructor = moduleRegistry.get("ClipboardItemConstructor");

        moduleRegistry
            .get("ActionHandlerRegistry")
            .register(
                new PasteToActiveAppActionHandler(
                    clipboard,
                    appleScriptUtility,
                    systemPreferences,
                    settingsManager,
                    fileSystemUtility,
                    clipboardItemConstructor,
                ),
            );
    }
}
