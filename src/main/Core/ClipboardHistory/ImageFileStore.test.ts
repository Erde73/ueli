import { join } from "node:path";

import type { FileSystemUtility } from "@Core/FileSystemUtility";
import { describe, expect, it, vi } from "vitest";

import { ImageFileStore } from "./ImageFileStore";

describe(ImageFileStore, () => {
    describe(ImageFileStore.prototype.save, () => {
        it("should write the buffer to a file named after the content hash and return the file name", async () => {
            const fileSystemUtility = { writeFile: vi.fn(), removeFile: vi.fn() } as unknown as FileSystemUtility;
            const store = new ImageFileStore(fileSystemUtility, "/tmp/ClipboardManager/images");

            const buffer = Buffer.from([1, 2, 3]);
            const fileName = await store.save(buffer, "abc123");

            expect(fileName).toBe("abc123.png");
            expect(fileSystemUtility.writeFile).toHaveBeenCalledWith(
                buffer,
                join("/tmp/ClipboardManager/images", "abc123.png"),
            );
        });
    });

    describe(ImageFileStore.prototype.getFilePath, () => {
        it("should return the absolute path for a given file name", () => {
            const fileSystemUtility = { writeFile: vi.fn(), removeFile: vi.fn() } as unknown as FileSystemUtility;
            const store = new ImageFileStore(fileSystemUtility, "/tmp/ClipboardManager/images");

            expect(store.getFilePath("abc123.png")).toBe(join("/tmp/ClipboardManager/images", "abc123.png"));
        });
    });

    describe(ImageFileStore.prototype.delete, () => {
        it("should remove the file with the given name", async () => {
            const fileSystemUtility = { writeFile: vi.fn(), removeFile: vi.fn() } as unknown as FileSystemUtility;
            const store = new ImageFileStore(fileSystemUtility, "/tmp/ClipboardManager/images");

            await store.delete("abc123.png");

            expect(fileSystemUtility.removeFile).toHaveBeenCalledWith(
                join("/tmp/ClipboardManager/images", "abc123.png"),
            );
        });
    });
});
