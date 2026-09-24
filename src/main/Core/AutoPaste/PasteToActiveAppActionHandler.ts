import type { SearchResultItemAction } from "@common/Core";
import { getExtensionSettingKey } from "@common/Core/Extension";
import type { ActionHandler } from "@Core/ActionHandler";
import type { AppleScriptUtility } from "@Core/AppleScriptUtility";
import type { FileSystemUtility } from "@Core/FileSystemUtility";
import type { SettingsManager } from "@Core/SettingsManager";
import type { Clipboard, ClipboardItem, SystemPreferences } from "electron";

import type { PasteActionArgument } from "./Contract";

const DEFAULT_AUTO_PASTE_DELAY_MS = 150;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export class PasteToActiveAppActionHandler implements ActionHandler {
    public readonly id = "pasteToActiveApp";

    public constructor(
        private readonly clipboard: Clipboard,
        private readonly appleScriptUtility: AppleScriptUtility,
        private readonly systemPreferences: SystemPreferences,
        private readonly settingsManager: SettingsManager,
        private readonly fileSystemUtility: FileSystemUtility,
        private readonly clipboardItemConstructor: typeof ClipboardItem,
    ) {}

    public async invokeAction(action: SearchResultItemAction): Promise<void> {
        const payload = JSON.parse(action.argument) as PasteActionArgument;

        if (payload.type === "text") {
            await this.clipboard.writeText(payload.text);
        } else {
            const buffer = await this.fileSystemUtility.readFile(payload.imageFilePath);
            await this.clipboard.write([
                new this.clipboardItemConstructor({
                    "image/png": new Blob([new Uint8Array(buffer)], { type: "image/png" }),
                }),
            ]);
        }

        if (!this.systemPreferences.isTrustedAccessibilityClient(false)) {
            this.systemPreferences.isTrustedAccessibilityClient(true);
            return;
        }

        const delayMs = this.settingsManager.getValue<number>(
            getExtensionSettingKey("ClipboardManager", "autoPasteDelayMs"),
            DEFAULT_AUTO_PASTE_DELAY_MS,
        );

        await sleep(delayMs);

        await this.appleScriptUtility.executeAppleScript(
            'tell application "System Events" to keystroke "v" using command down',
        );
    }
}
