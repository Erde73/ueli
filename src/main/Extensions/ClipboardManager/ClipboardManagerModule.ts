import type { UeliModuleRegistry } from "@Core/ModuleRegistry";

import type { ExtensionBootstrapResult } from "../ExtensionBootstrapResult";
import type { ExtensionModule } from "../ExtensionModule";
import { ClearClipboardHistoryActionHandler } from "./ClearClipboardHistoryActionHandler";
import { ClipboardManagerExtension } from "./ClipboardManagerExtension";
import { CopyImageToClipboardActionHandler } from "./CopyImageToClipboardActionHandler";
import { DeleteClipboardHistoryItemActionHandler } from "./DeleteClipboardHistoryItemActionHandler";
import { DeleteSnippetActionHandler } from "./DeleteSnippetActionHandler";
import { SaveClipboardItemAsSnippetActionHandler } from "./SaveClipboardItemAsSnippetActionHandler";

export class ClipboardManagerModule implements ExtensionModule {
    public bootstrap(moduleRegistry: UeliModuleRegistry): ExtensionBootstrapResult {
        const clipboardHistoryRepository = moduleRegistry.get("ClipboardHistoryRepository");
        const snippetRepository = moduleRegistry.get("SnippetRepository");
        const imagesFolderPath = moduleRegistry.get("ClipboardImagesFolderPath");

        return {
            extension: new ClipboardManagerExtension(
                moduleRegistry.get("OperatingSystem"),
                moduleRegistry.get("AssetPathResolver"),
                moduleRegistry.get("SettingsManager"),
                moduleRegistry.get("Translator"),
                clipboardHistoryRepository,
                snippetRepository,
                imagesFolderPath,
            ),
            actionHandlers: [
                new DeleteClipboardHistoryItemActionHandler(clipboardHistoryRepository),
                new ClearClipboardHistoryActionHandler(clipboardHistoryRepository),
                new CopyImageToClipboardActionHandler(
                    moduleRegistry.get("Clipboard"),
                    moduleRegistry.get("FileSystemUtility"),
                    moduleRegistry.get("ClipboardItemConstructor"),
                    imagesFolderPath,
                ),
                new SaveClipboardItemAsSnippetActionHandler(clipboardHistoryRepository, snippetRepository),
                new DeleteSnippetActionHandler(snippetRepository),
            ],
        };
    }
}
