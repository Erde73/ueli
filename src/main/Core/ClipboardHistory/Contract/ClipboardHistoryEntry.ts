export type ClipboardHistoryContentType = "text" | "image";

export type ClipboardHistoryEntry = {
    id: number;
    contentType: ClipboardHistoryContentType;
    textContent: string | null;
    imageFileName: string | null;
    preview: string;
    useCount: number;
    pinned: boolean;
    createdAt: number;
    lastUsedAt: number;
};
