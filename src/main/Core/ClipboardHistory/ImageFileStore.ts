import { join } from "node:path";

import type { FileSystemUtility } from "@Core/FileSystemUtility";

export class ImageFileStore {
    public constructor(
        private readonly fileSystemUtility: FileSystemUtility,
        private readonly folderPath: string,
    ) {}

    public async save(imageBuffer: Buffer, contentHash: string): Promise<string> {
        const fileName = `${contentHash}.png`;
        await this.fileSystemUtility.writeFile(imageBuffer, this.getFilePath(fileName));
        return fileName;
    }

    public getFilePath(fileName: string): string {
        return join(this.folderPath, fileName);
    }

    public async delete(fileName: string): Promise<void> {
        await this.fileSystemUtility.removeFile(this.getFilePath(fileName));
    }
}
