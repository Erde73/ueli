import type { DateProvider } from "@Core/DateProvider";
import type { UeliModuleRegistry } from "@Core/ModuleRegistry";
import Database from "better-sqlite3";
import { describe, expect, it, vi } from "vitest";

import { initializeSchema } from "../ClipboardManagerDatabase/schema";
import { SnippetManagerModule } from "./SnippetManagerModule";
import { SnippetRepository } from "./SnippetRepository";

describe(SnippetManagerModule, () => {
    it("should register a SnippetRepository", () => {
        const database = new Database(":memory:");
        initializeSchema(database);

        const dateProvider = <DateProvider>{ get: vi.fn() };

        const moduleRegistry = {
            get: vi.fn((key: string) => ({ ClipboardManagerDatabase: database, DateProvider: dateProvider })[key]),
            register: vi.fn(),
        } as unknown as UeliModuleRegistry;

        SnippetManagerModule.bootstrap(moduleRegistry);

        expect(moduleRegistry.register).toHaveBeenCalledWith("SnippetRepository", expect.any(SnippetRepository));

        database.close();
    });
});
