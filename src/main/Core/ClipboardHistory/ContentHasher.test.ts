import { describe, expect, it } from "vitest";

import { hashContent } from "./ContentHasher";

describe(hashContent, () => {
    it("should return the same hash for the same text content", () => {
        expect(hashContent("hello world")).toBe(hashContent("hello world"));
    });

    it("should return a different hash for different text content", () => {
        expect(hashContent("hello world")).not.toBe(hashContent("hello there"));
    });

    it("should return the same hash for the same buffer content", () => {
        const buffer = Buffer.from([1, 2, 3, 4]);
        expect(hashContent(buffer)).toBe(hashContent(Buffer.from([1, 2, 3, 4])));
    });

    it("should return a different hash for a different buffer content", () => {
        expect(hashContent(Buffer.from([1, 2, 3]))).not.toBe(hashContent(Buffer.from([1, 2, 4])));
    });

    it("should return a hex-encoded sha256 hash (64 characters)", () => {
        expect(hashContent("hello world")).toMatch(/^[0-9a-f]{64}$/);
    });
});
