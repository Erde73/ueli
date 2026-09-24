import type { SearchResultItemAction } from "@common/Core";
import type { ActionHandler } from "@Core/ActionHandler";
import type { ClipboardHistoryRepository } from "@Core/ClipboardHistory";
import type { SnippetRepository } from "@Core/SnippetManager";

export class SaveClipboardItemAsSnippetActionHandler implements ActionHandler {
    public readonly id = "saveClipboardItemAsSnippet";

    public constructor(
        private readonly clipboardHistoryRepository: ClipboardHistoryRepository,
        private readonly snippetRepository: SnippetRepository,
    ) {}

    public async invokeAction(action: SearchResultItemAction): Promise<void> {
        const entryId = Number(action.argument);
        const entry = this.clipboardHistoryRepository.getAll().find((candidate) => candidate.id === entryId);

        if (!entry || entry.contentType !== "text" || !entry.textContent) {
            return;
        }

        this.snippetRepository.add({ name: entry.preview, content: entry.textContent });
    }
}
