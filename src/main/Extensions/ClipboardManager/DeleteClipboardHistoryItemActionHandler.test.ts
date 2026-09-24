import type { SearchResultItemAction } from "@common/Core";
import type { ClipboardHistoryRepository } from "@Core/ClipboardHistory";
import { describe, expect, it, vi } from "vitest";

import { DeleteClipboardHistoryItemActionHandler } from "./DeleteClipboardHistoryItemActionHandler";

describe(DeleteClipboardHistoryItemActionHandler, () => {
    describe(DeleteClipboardHistoryItemActionHandler.prototype.id, () =>
        it(`should be "deleteClipboardHistoryItem"`, () => {
            const clipboardHistoryRepository = <ClipboardHistoryRepository>{};
            expect(new DeleteClipboardHistoryItemActionHandler(clipboardHistoryRepository).id).toBe(
                "deleteClipboardHistoryItem",
            );
        }),
    );

    describe(DeleteClipboardHistoryItemActionHandler.prototype.invokeAction, () => {
        it("should delete the clipboard history entry with the id given in the action argument", async () => {
            const clipboardHistoryRepository = { delete: vi.fn() } as unknown as ClipboardHistoryRepository;

            await new DeleteClipboardHistoryItemActionHandler(clipboardHistoryRepository).invokeAction({
                argument: "42",
            } as unknown as SearchResultItemAction);

            expect(clipboardHistoryRepository.delete).toHaveBeenCalledWith(42);
        });
    });
});
