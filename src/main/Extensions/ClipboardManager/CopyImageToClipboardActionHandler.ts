import { join } from "node:path";

import type { SearchResultItemAction } from "@common/Core";
import type { ActionHandler } from "@Core/ActionHandler";
import type { FileSystemUtility } from "@Core/FileSystemUtility";
import type { Clipboard, ClipboardItem } from "electron";

export class CopyImageToClipboardActionHandler implements ActionHandler {
    public readonly id = "copyImageToClipboard";

    public constructor(
        private readonly clipboard: Clipboard,
        private readonly fileSystemUtility: FileSystemUtility,
        private readonly clipboardItemConstructor: typeof ClipboardItem,
        private readonly imagesFolderPath: string,
    ) {}

    public async invokeAction(action: SearchResultItemAction): Promise<void> {
        const buffer = await this.fileSystemUtility.readFile(join(this.imagesFolderPath, action.argument));

        await this.clipboard.write([
            new this.clipboardItemConstructor({
                "image/png": new Blob([new Uint8Array(buffer)], { type: "image/png" }),
            }),
        ]);
    }
}
