import path from "path";

export const RELEASES_STORAGE_ROOT = path.resolve(
    process.cwd(),
    "storage",
    "releases",
);

export function isSafeStoragePath(filePath: string): boolean {
    return filePath.startsWith(`${RELEASES_STORAGE_ROOT}${path.sep}`);
}

export function isSafeFileName(fileName: string): boolean {
    return (
        fileName === path.basename(fileName) &&
        !fileName.includes("..") &&
        !fileName.includes("/") &&
        !fileName.includes("\\")
    );
}
