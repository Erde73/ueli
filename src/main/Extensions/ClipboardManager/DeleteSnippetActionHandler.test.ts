import type { SearchResultItemAction } from "@common/Core";
import type { SnippetRepository } from "@Core/SnippetManager";
import { describe, expect, it, vi } from "vitest";

import { DeleteSnippetActionHandler } from "./DeleteSnippetActionHandler";

describe(DeleteSnippetActionHandler, () => {
    describe(DeleteSnippetActionHandler.prototype.id, () =>
        it(`should be "deleteSnippet"`, () => {
            const snippetRepository = <SnippetRepository>{};
            expect(new DeleteSnippetActionHandler(snippetRepository).id).toBe("deleteSnippet");
        }),
    );

    describe(DeleteSnippetActionHandler.prototype.invokeAction, () => {
        it("should delete the snippet with the id given in the action argument", async () => {
            const snippetRepository = { delete: vi.fn() } as unknown as SnippetRepository;

            await new DeleteSnippetActionHandler(snippetRepository).invokeAction({
                argument: "7",
            } as unknown as SearchResultItemAction);

            expect(snippetRepository.delete).toHaveBeenCalledWith(7);
        });
    });
});
