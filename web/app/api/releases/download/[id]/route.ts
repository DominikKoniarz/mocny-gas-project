import { releasesStore } from "@/lib/store";
import type { Platform } from "@/lib/types";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import { Readable } from "stream";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform") as Platform | null;

    if (!platform || !["mac", "windows"].includes(platform)) {
        return NextResponse.json(
            { error: "Platform is required. Use 'mac' or 'windows'" },
            { status: 400 },
        );
    }

    const release = releasesStore.getById(id);

    if (!release) {
        return NextResponse.json(
            { error: "Release not found" },
            { status: 404 },
        );
    }

    if (!release.isEnabled) {
        return NextResponse.json(
            { error: "This release is not available for download" },
            { status: 403 },
        );
    }

    const file = releasesStore.getFileRecord(id, platform);

    if (!file) {
        return NextResponse.json(
            { error: `No ${platform} file available for this release` },
            { status: 404 },
        );
    }

    const storageRoot = path.resolve(process.cwd(), "storage", "releases");
    const filePath = path.resolve(storageRoot, file.storagePath);

    if (!filePath.startsWith(`${storageRoot}${path.sep}`)) {
        return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    let fileStat;
    try {
        fileStat = await stat(filePath);
    } catch {
        return NextResponse.json(
            { error: "Artifact file not found" },
            { status: 404 },
        );
    }

    releasesStore.incrementDownload(id, platform);

    const stream = createReadStream(filePath);

    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
        headers: {
            "Content-Type": file.contentType,
            "Content-Length": fileStat.size.toString(),
            "Content-Disposition": `attachment; filename="${file.fileName.replace(/"/g, "")}"`,
            "X-Artifact-SHA256": file.sha256,
            "X-Release-Version": release.version,
            "X-Release-Platform": platform,
        },
    });
}
