import type { SearchResultItemAction } from "@common/Core";
import type { ActionHandler } from "@Core/ActionHandler";
import type { ClipboardHistoryRepository } from "@Core/ClipboardHistory";

export class DeleteClipboardHistoryItemActionHandler implements ActionHandler {
    public readonly id = "deleteClipboardHistoryItem";

    public constructor(private readonly clipboardHistoryRepository: ClipboardHistoryRepository) {}

    public async invokeAction(action: SearchResultItemAction): Promise<void> {
        this.clipboardHistoryRepository.delete(Number(action.argument));
    }
}
