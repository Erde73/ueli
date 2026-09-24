import { join } from "node:path";

import type { SearchResultItemAction } from "@common/Core";
import type { FileSystemUtility } from "@Core/FileSystemUtility";
import type { Clipboard, ClipboardItem } from "electron";
import { describe, expect, it, vi } from "vitest";

import { CopyImageToClipboardActionHandler } from "./CopyImageToClipboardActionHandler";

class FakeClipboardItem {
    public constructor(public readonly items: Record<string, unknown>) {}
}

describe(CopyImageToClipboardActionHandler, () => {
    describe(CopyImageToClipboardActionHandler.prototype.id, () =>
        it(`should be "copyImageToClipboard"`, () => {
            const handler = new CopyImageToClipboardActionHandler(
                <Clipboard>{},
                <FileSystemUtility>{},
                FakeClipboardItem as unknown as typeof ClipboardItem,
                "/images",
            );
            expect(handler.id).toBe("copyImageToClipboard");
        }),
    );

    describe(CopyImageToClipboardActionHandler.prototype.invokeAction, () => {
        it("should read the image file and write it to the clipboard as a PNG ClipboardItem", async () => {
            const buffer = Buffer.from([1, 2, 3]);
            const fileSystemUtility = { readFile: vi.fn().mockResolvedValue(buffer) } as unknown as FileSystemUtility;
            const writeMock = vi.fn().mockResolvedValue(undefined);
            const clipboard = { write: writeMock } as unknown as Clipboard;

            const handler = new CopyImageToClipboardActionHandler(
                clipboard,
                fileSystemUtility,
                FakeClipboardItem as unknown as typeof ClipboardItem,
                "/images",
            );

            await handler.invokeAction(<SearchResultItemAction>{ argument: "abc123.png" });

            expect(fileSystemUtility.readFile).toHaveBeenCalledWith(join("/images", "abc123.png"));
            expect(writeMock).toHaveBeenCalledTimes(1);

            const [writtenItems] = writeMock.mock.calls[0] as [FakeClipboardItem[]];
            expect(writtenItems).toHaveLength(1);
            expect(Object.keys(writtenItems[0].items)).toEqual(["image/png"]);
        });
    });
});
