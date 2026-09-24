import type { ClipboardHistoryRepository } from "@Core/ClipboardHistory";
import { describe, expect, it, vi } from "vitest";

import { ClearClipboardHistoryActionHandler } from "./ClearClipboardHistoryActionHandler";

describe(ClearClipboardHistoryActionHandler, () => {
    describe(ClearClipboardHistoryActionHandler.prototype.id, () =>
        it(`should be "clearClipboardHistory"`, () => {
            const clipboardHistoryRepository = <ClipboardHistoryRepository>{};
            expect(new ClearClipboardHistoryActionHandler(clipboardHistoryRepository).id).toBe("clearClipboardHistory");
        }),
    );

    describe(ClearClipboardHistoryActionHandler.prototype.invokeAction, () => {
        it("should clear the clipboard history", async () => {
            const clipboardHistoryRepository = { clear: vi.fn() } as unknown as ClipboardHistoryRepository;

            await new ClearClipboardHistoryActionHandler(clipboardHistoryRepository).invokeAction();

            expect(clipboardHistoryRepository.clear).toHaveBeenCalled();
        });
    });
});
