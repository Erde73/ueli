import type { ActionHandler } from "@Core/ActionHandler";
import type { ClipboardHistoryRepository } from "@Core/ClipboardHistory";

export class ClearClipboardHistoryActionHandler implements ActionHandler {
    public readonly id = "clearClipboardHistory";

    public constructor(private readonly clipboardHistoryRepository: ClipboardHistoryRepository) {}

    public async invokeAction(): Promise<void> {
        this.clipboardHistoryRepository.clear();
    }
}
