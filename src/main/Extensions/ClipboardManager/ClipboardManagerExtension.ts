import { join } from "node:path";

import {
    createCopyToClipboardAction,
    createEmptyInstantSearchResult,
    type InstantSearchResultItems,
    type OperatingSystem,
    type SearchResultItem,
} from "@common/Core";
import { getExtensionSettingKey } from "@common/Core/Extension";
import type { SearchEngineId } from "@common/Core/Search";
import { searchFilter } from "@common/Core/Search/SearchFilter";
import type { InvocationArgument } from "@common/Extensions/ClipboardManager";
import type { AssetPathResolver } from "@Core/AssetPathResolver";
import type { PasteActionArgument } from "@Core/AutoPaste";
import type { ClipboardHistoryEntry, ClipboardHistoryRepository } from "@Core/ClipboardHistory";
import type { Extension } from "@Core/Extension";
import type { SettingsManager } from "@Core/SettingsManager";
import type { Snippet, SnippetRepository } from "@Core/SnippetManager";
import type { Translator } from "@Core/Translator";

import type { Settings } from "./Settings";

export class ClipboardManagerExtension implements Extension {
    public readonly id = "ClipboardManager";

    public readonly name = "Clipboard Manager";

    public readonly nameTranslation = {
        key: "extensionName",
        namespace: "extension[ClipboardManager]",
    };

    public readonly author = {
        name: "Daichi Shimizu",
        githubUserName: "Erde73",
    };

    public constructor(
        private readonly operatingSystem: OperatingSystem,
        private readonly assetPathResolver: AssetPathResolver,
        private readonly settingsManager: SettingsManager,
        private readonly translator: Translator,
        private readonly clipboardHistoryRepository: ClipboardHistoryRepository,
        private readonly snippetRepository: SnippetRepository,
        private readonly imagesFolderPath: string,
    ) {}

    public async getSearchResultItems(): Promise<SearchResultItem[]> {
        return [];
    }

    public isSupported(): boolean {
        return this.operatingSystem === "macOS";
    }

    public getSettingDefaultValue<T extends keyof Settings>(key: T): Settings[T] {
        const defaultSettings: Settings = {
            prefix: "clip",
            maxHistorySize: 300,
            snippetPrefix: "snip",
            autoPasteDelayMs: 150,
        };

        return defaultSettings[key];
    }

    public getImage() {
        return {
            url: `file://${this.assetPathResolver.getExtensionAssetPath(this.id, "clipboard-manager.png")}`,
        };
    }

    public getI18nResources() {
        return {
            "en-US": {
                extensionName: "Clipboard Manager",
                copyToClipboard: "Copy to clipboard",
                pasteToActiveApp: "Paste into active app",
                imageEntryLabel: "Image",
                delete: "Delete",
                saveAsSnippet: "Save as snippet",
                searchResultItemDescription: "Clipboard history",
                snippetDescription: "Snippet",
                prefixLabel: "History prefix",
                prefixDescription:
                    "The prefix to trigger the clipboard history search. Pattern: <prefix> <search term>",
                snippetPrefixLabel: "Snippet prefix",
                snippetPrefixDescription:
                    "The prefix to trigger the snippet search. Pattern: <snippet prefix> <search term>",
                maxHistorySizeLabel: "Max history size",
                maxHistorySizeDescription: "The maximum number of clipboard history entries to keep.",
                autoPasteDelayMsLabel: "Auto-paste delay (ms)",
                autoPasteDelayMsDescription:
                    "Delay before sending the paste keystroke, to give the previous app time to regain focus.",
                snippetsSectionTitle: "Snippets",
                snippetNameHeader: "Name",
                snippetContentHeader: "Content",
                addSnippet: "Add snippet",
                editSnippet: "Edit snippet",
                snippetNameLabel: "Name",
                snippetContentLabel: "Content",
                snippetNameRequiredError: "Name is required",
                snippetContentRequiredError: "Content is required",
                save: "Save",
                cancel: "Cancel",
                edit: "Edit",
                remove: "Remove",
            },
        };
    }

    public getInstantSearchResultItems(searchTerm: string): InstantSearchResultItems {
        const snippetPrefix = this.getSnippetPrefix();

        if (searchTerm.startsWith(snippetPrefix)) {
            return this.getSnippetResults(searchTerm.replace(snippetPrefix, "").trim());
        }

        const prefix = this.getPrefix();

        if (searchTerm.startsWith(prefix)) {
            return this.getHistoryResults(searchTerm.replace(prefix, "").trim());
        }

        return createEmptyInstantSearchResult();
    }

    public async invoke(argument: unknown): Promise<Snippet[]> {
        const invocationArgument = argument as InvocationArgument;

        switch (invocationArgument.type) {
            case "add":
                this.snippetRepository.add({ name: invocationArgument.name, content: invocationArgument.content });
                break;
            case "update":
                this.snippetRepository.update({
                    id: invocationArgument.id,
                    name: invocationArgument.name,
                    content: invocationArgument.content,
                });
                break;
            case "delete":
                this.snippetRepository.delete(invocationArgument.id);
                break;
            case "getAll":
            default:
                break;
        }

        return this.snippetRepository.getAll();
    }

    private getHistoryResults(query: string): InstantSearchResultItems {
        const { t } = this.translator.createT(this.getI18nResources());

        const searchResultItems = this.clipboardHistoryRepository
            .getAll()
            .map((entry) => this.toSearchResultItem(entry, t));

        return this.filterResults(searchResultItems, query);
    }

    private getSnippetResults(query: string): InstantSearchResultItems {
        const { t } = this.translator.createT(this.getI18nResources());

        const searchResultItems = this.snippetRepository
            .getAll()
            .map((snippet) => this.toSnippetSearchResultItem(snippet, t));

        return this.filterResults(searchResultItems, query);
    }

    private filterResults(searchResultItems: SearchResultItem[], query: string): InstantSearchResultItems {
        if (query === "") {
            return { after: searchResultItems, before: [] };
        }

        const fuzziness = this.settingsManager.getValue<number>("searchEngine.fuzziness", 0.5);
        const maxSearchResultItems = this.settingsManager.getValue<number>("searchEngine.maxResultLength", 50);
        const searchEngineId = this.settingsManager.getValue<SearchEngineId>("searchEngine.id", "fuzzysort");

        return {
            after: searchFilter(
                { searchResultItems, searchTerm: query, fuzziness, maxSearchResultItems },
                searchEngineId,
            ),
            before: [],
        };
    }

    private getPrefix(): string {
        return this.settingsManager.getValue<string>(
            getExtensionSettingKey(this.id, "prefix"),
            this.getSettingDefaultValue("prefix"),
        );
    }

    private getSnippetPrefix(): string {
        return this.settingsManager.getValue<string>(
            getExtensionSettingKey(this.id, "snippetPrefix"),
            this.getSettingDefaultValue("snippetPrefix"),
        );
    }

    private toSearchResultItem(entry: ClipboardHistoryEntry, t: (key: string) => string): SearchResultItem {
        const isImage = entry.contentType === "image" && entry.imageFileName;

        const pasteArgument: PasteActionArgument = isImage
            ? { type: "image", imageFilePath: join(this.imagesFolderPath, entry.imageFileName as string) }
            : { type: "text", text: entry.textContent ?? "" };

        const copyOnlyAction = isImage
            ? {
                  handlerId: "copyImageToClipboard",
                  argument: entry.imageFileName as string,
                  description: t("copyToClipboard"),
                  fluentIcon: "CopyRegular" as const,
              }
            : createCopyToClipboardAction({
                  textToCopy: entry.textContent ?? "",
                  description: t("copyToClipboard"),
              });

        return {
            id: `clipboardHistory-${entry.id}`,
            name: isImage ? t("imageEntryLabel") : entry.preview,
            description: t("searchResultItemDescription"),
            image: this.getImage(),
            defaultAction: {
                handlerId: "pasteToActiveApp",
                argument: JSON.stringify(pasteArgument),
                description: t("pasteToActiveApp"),
                fluentIcon: "ClipboardPasteRegular",
                hideWindowAfterInvocation: true,
            },
            additionalActions: [
                copyOnlyAction,
                {
                    handlerId: "saveClipboardItemAsSnippet",
                    argument: String(entry.id),
                    description: t("saveAsSnippet"),
                    fluentIcon: "CopyRegular",
                },
                {
                    handlerId: "deleteClipboardHistoryItem",
                    argument: String(entry.id),
                    description: t("delete"),
                    fluentIcon: "DeleteDismissRegular",
                },
            ],
        };
    }

    private toSnippetSearchResultItem(snippet: Snippet, t: (key: string) => string): SearchResultItem {
        const pasteArgument: PasteActionArgument = { type: "text", text: snippet.content };

        return {
            id: `snippet-${snippet.id}`,
            name: snippet.name,
            description: t("snippetDescription"),
            image: this.getImage(),
            defaultAction: {
                handlerId: "pasteToActiveApp",
                argument: JSON.stringify(pasteArgument),
                description: t("pasteToActiveApp"),
                fluentIcon: "ClipboardPasteRegular",
                hideWindowAfterInvocation: true,
            },
            additionalActions: [
                createCopyToClipboardAction({
                    textToCopy: snippet.content,
                    description: t("copyToClipboard"),
                }),
                {
                    handlerId: "deleteSnippet",
                    argument: String(snippet.id),
                    description: t("delete"),
                    fluentIcon: "DeleteDismissRegular",
                },
            ],
        };
    }
}
