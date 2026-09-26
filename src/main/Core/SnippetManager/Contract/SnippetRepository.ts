import type { Snippet } from "./Snippet";

export interface SnippetRepository {
    /**
     * Creates a new snippet with the given name and content.
     */
    add(input: { name: string; content: string }): void;

    /**
     * Returns all snippets, ordered by most recently updated first.
     */
    getAll(): Snippet[];

    /**
     * Deletes a single snippet by id.
     */
    delete(id: number): void;

    /**
     * Updates the name and content of an existing snippet by id.
     */
    update(input: { id: number; name: string; content: string }): void;

    /**
     * Increments the usage counter of a snippet.
     */
    incrementUsage(id: number): void;
}
