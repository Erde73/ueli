import { getExtensionSettingKey } from "@common/Core/Extension";
import type { SettingsManager } from "@Core/SettingsManager";
import type { Clipboard } from "electron";

import { hashContent } from "./ContentHasher";
import type { ClipboardHistoryRepository } from "./Contract";
import type { ImageFileStore } from "./ImageFileStore";

const PREVIEW_MAX_LENGTH = 200;

type ReadableClipboardItem = {
    types: string[];
    getType(type: string): Promise<Blob>;
};

export class ClipboardWatcher {
    private timeoutId: NodeJS.Timeout | undefined;
    private lastText = "";
    private lastImageHash = "";

    public constructor(
        private readonly clipboard: Clipboard,
        private readonly clipboardHistoryRepository: ClipboardHistoryRepository,
        private readonly imageFileStore: ImageFileStore,
        private readonly settingsManager: SettingsManager,
        private readonly pollingIntervalMs: number,
    ) {}

    public start(): void {
        this.scheduleNextPoll();
    }

    public stop(): void {
        clearTimeout(this.timeoutId);
        this.timeoutId = undefined;
    }

    private scheduleNextPoll(): void {
        this.timeoutId = setTimeout(async () => {
            await this.poll();
            this.scheduleNextPoll();
        }, this.pollingIntervalMs);
    }

    private async poll(): Promise<void> {
        const items = (await this.clipboard.read()) as unknown as ReadableClipboardItem[];
        const imageItem = items.find((item) => item.types.some((type) => type.startsWith("image/")));

        if (imageItem) {
            await this.pollImage(imageItem);
            return;
        }

        await this.pollText();
    }

    private async pollImage(item: ReadableClipboardItem): Promise<void> {
        const imageType = item.types.find((type) => type.startsWith("image/"));

        if (!imageType) {
            return;
        }

        const blob = await item.getType(imageType);
        const buffer = Buffer.from(await blob.arrayBuffer());
        const contentHash = hashContent(buffer);

        if (contentHash === this.lastImageHash) {
            return;
        }

        this.lastImageHash = contentHash;

        const imageFileName = await this.imageFileStore.save(buffer, contentHash);

        this.clipboardHistoryRepository.add({
            contentType: "image",
            imageFileName,
            contentHash,
            preview: "",
            maxHistorySize: this.getMaxHistorySize(),
        });
    }

    private async pollText(): Promise<void> {
        const text = await this.clipboard.readText();

        if (!text || text === this.lastText) {
            return;
        }

        this.lastText = text;

        this.clipboardHistoryRepository.add({
            contentType: "text",
            textContent: text,
            contentHash: hashContent(text),
            preview: text.length > PREVIEW_MAX_LENGTH ? `${text.slice(0, PREVIEW_MAX_LENGTH)}…` : text,
            maxHistorySize: this.getMaxHistorySize(),
        });
    }

    private getMaxHistorySize(): number {
        return this.settingsManager.getValue(getExtensionSettingKey("ClipboardManager", "maxHistorySize"), 300);
    }
}
