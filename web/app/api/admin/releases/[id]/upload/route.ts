import { releasesStore } from "@/lib/store";
import type { Platform } from "@/lib/types";
import { createHash, randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

const validExtensionsByPlatform: Record<Platform, string[]> = {
    mac: [".dmg", ".zip"],
    windows: [".exe", ".msi", ".nupkg"],
};

const contentTypesByExtension: Record<string, string> = {
    ".dmg": "application/x-apple-diskimage",
    ".exe": "application/vnd.microsoft.portable-executable",
    ".msi": "application/x-msi",
    ".nupkg": "application/zip",
    ".zip": "application/zip",
};

function sanitizeFileName(fileName: string): string {
    return path
        .basename(fileName)
        .replace(/[^a-zA-Z0-9._-]/g, "-")
        .replace(/-+/g, "-");
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const release = releasesStore.getById(id);

    if (!release) {
        return NextResponse.json(
            { error: "Release not found" },
            { status: 404 },
        );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const platform = formData.get("platform") as Platform | null;

    if (!file) {
        return NextResponse.json(
            { error: "No file provided" },
            { status: 400 },
        );
    }

    if (!platform || !["mac", "windows"].includes(platform)) {
        return NextResponse.json(
            { error: "Invalid platform" },
            { status: 400 },
        );
    }

    const fileName = sanitizeFileName(file.name);
    const extension = path.extname(fileName).toLowerCase();
    const validExtensions = validExtensionsByPlatform[platform];

    if (!validExtensions.includes(extension)) {
        return NextResponse.json(
            {
                error: `Invalid file type. Expected: ${validExtensions.join(", ")}`,
            },
            { status: 400 },
        );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const sha256 = createHash("sha256").update(buffer).digest("hex");
    const contentType =
        contentTypesByExtension[extension] ||
        file.type ||
        "application/octet-stream";

    const storageRoot = path.join(process.cwd(), "storage", "releases");
    const storageDir = path.join(storageRoot, release.id);
    const storedFileName = `${platform}-${randomUUID()}${extension}`;
    const storagePath = path.join(release.id, storedFileName);
    const filePath = path.join(storageDir, storedFileName);

    await mkdir(storageDir, { recursive: true });
    await writeFile(filePath, buffer);

    const downloadUrl = `/api/releases/download/${release.id}?platform=${platform}`;
    releasesStore.setFile(id, platform, {
        fileName,
        fileSize: file.size,
        storagePath,
        contentType,
        sha256,
        signature: null,
        signatureAlgorithm: null,
        signedAt: null,
        signingKeyId: null,
        downloadUrl,
    });

    return NextResponse.json({
        success: true,
        fileName,
        fileSize: file.size,
        contentType,
        sha256,
        downloadUrl,
    });
}
