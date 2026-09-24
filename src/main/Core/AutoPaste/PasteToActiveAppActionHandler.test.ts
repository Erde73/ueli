import type { SearchResultItemAction } from "@common/Core";
import type { AppleScriptUtility } from "@Core/AppleScriptUtility";
import type { FileSystemUtility } from "@Core/FileSystemUtility";
import type { SettingsManager } from "@Core/SettingsManager";
import type { Clipboard, ClipboardItem, SystemPreferences } from "electron";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PasteToActiveAppActionHandler } from "./PasteToActiveAppActionHandler";

class FakeClipboardItem {
    public constructor(public readonly items: Record<string, unknown>) {}
}

const buildAction = (payload: unknown): SearchResultItemAction =>
    ({ argument: JSON.stringify(payload) }) as unknown as SearchResultItemAction;

describe(PasteToActiveAppActionHandler, () => {
    let clipboard: Clipboard;
    let appleScriptUtility: AppleScriptUtility;
    let systemPreferences: SystemPreferences;
    let settingsManager: SettingsManager;
    let fileSystemUtility: FileSystemUtility;
    let writeTextMock: ReturnType<typeof vi.fn>;
    let writeMock: ReturnType<typeof vi.fn>;
    let executeAppleScriptMock: ReturnType<typeof vi.fn>;
    let isTrustedAccessibilityClientMock: ReturnType<typeof vi.fn>;

    const createHandler = () =>
        new PasteToActiveAppActionHandler(
            clipboard,
            appleScriptUtility,
            systemPreferences,
            settingsManager,
            fileSystemUtility,
            FakeClipboardItem as unknown as typeof ClipboardItem,
        );

    beforeEach(() => {
        vi.useFakeTimers();

        writeTextMock = vi.fn().mockResolvedValue(undefined);
        writeMock = vi.fn().mockResolvedValue(undefined);
        clipboard = { writeText: writeTextMock, write: writeMock } as unknown as Clipboard;

        executeAppleScriptMock = vi.fn().mockResolvedValue("");
        appleScriptUtility = { executeAppleScript: executeAppleScriptMock } as unknown as AppleScriptUtility;

        isTrustedAccessibilityClientMock = vi.fn().mockReturnValue(true);
        systemPreferences = {
            isTrustedAccessibilityClient: isTrustedAccessibilityClientMock,
        } as unknown as SystemPreferences;

        settingsManager = { getValue: vi.fn().mockReturnValue(150), updateValue: vi.fn() };

        fileSystemUtility = {
            readFile: vi.fn().mockResolvedValue(Buffer.from([1, 2, 3])),
        } as unknown as FileSystemUtility;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe(PasteToActiveAppActionHandler.prototype.id, () =>
        it(`should be "pasteToActiveApp"`, () => {
            expect(createHandler().id).toBe("pasteToActiveApp");
        }),
    );

    describe(PasteToActiveAppActionHandler.prototype.invokeAction, () => {
        it("should write the text to the clipboard", async () => {
            const promise = createHandler().invokeAction(buildAction({ type: "text", text: "hello world" }));
            await vi.runAllTimersAsync();
            await promise;

            expect(writeTextMock).toHaveBeenCalledWith("hello world");
        });

        it("should write the image file to the clipboard as a PNG ClipboardItem", async () => {
            const promise = createHandler().invokeAction(
                buildAction({ type: "image", imageFilePath: "/images/abc.png" }),
            );
            await vi.runAllTimersAsync();
            await promise;

            expect(fileSystemUtility.readFile).toHaveBeenCalledWith("/images/abc.png");
            expect(writeMock).toHaveBeenCalledTimes(1);

            const [writtenItems] = writeMock.mock.calls[0] as [FakeClipboardItem[]];
            expect(Object.keys(writtenItems[0].items)).toEqual(["image/png"]);
        });

        it("should send Cmd+V via System Events after the configured delay, when accessibility access is granted", async () => {
            const promise = createHandler().invokeAction(buildAction({ type: "text", text: "hello world" }));

            await vi.advanceTimersByTimeAsync(149);
            expect(executeAppleScriptMock).not.toHaveBeenCalled();

            await vi.advanceTimersByTimeAsync(1);
            await promise;

            expect(executeAppleScriptMock).toHaveBeenCalledWith(
                'tell application "System Events" to keystroke "v" using command down',
            );
        });

        it("should not send Cmd+V and should prompt for accessibility access when it is not granted", async () => {
            isTrustedAccessibilityClientMock.mockReturnValue(false);

            const promise = createHandler().invokeAction(buildAction({ type: "text", text: "hello world" }));
            await vi.runAllTimersAsync();
            await promise;

            expect(isTrustedAccessibilityClientMock).toHaveBeenCalledWith(false);
            expect(isTrustedAccessibilityClientMock).toHaveBeenCalledWith(true);
            expect(executeAppleScriptMock).not.toHaveBeenCalled();
            expect(writeTextMock).toHaveBeenCalledWith("hello world");
        });
    });
});
