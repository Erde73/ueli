import type { SearchResultItemAction } from "@common/Core";
import type { ActionHandler } from "@Core/ActionHandler";
import type { SnippetRepository } from "@Core/SnippetManager";

export class DeleteSnippetActionHandler implements ActionHandler {
    public readonly id = "deleteSnippet";

    public constructor(private readonly snippetRepository: SnippetRepository) {}

    public async invokeAction(action: SearchResultItemAction): Promise<void> {
        this.snippetRepository.delete(Number(action.argument));
    }
}
