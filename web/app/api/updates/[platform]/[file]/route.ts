import { platformSchema, validationError } from "@/lib/api/validation";
import { releasesStore } from "@/lib/store";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import { Readable } from "stream";

function isSafeFileName(fileName: string): boolean {
    return (
        fileName === path.basename(fileName) &&
        !fileName.includes("..") &&
        !fileName.includes("/") &&
        !fileName.includes("\\")
    );
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ platform: string; file: string }> },
) {
    const { platform: rawPlatform, file: rawFile } = await params;
    const parsed = platformSchema.safeParse(rawPlatform);
    if (!parsed.success) {
        return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const platform = parsed.data;
    const fileName = rawFile;

    if (!isSafeFileName(fileName)) {
        return NextResponse.json({ error: "Invalid file name" }, { status: 400 });
    }

    const release = releasesStore.getLatestEnabled(platform, {
        requireUpdateFiles: true,
    });

    if (!release) {
        return NextResponse.json(
            { error: `No ${platform} release available` },
            { status: 404 },
        );
    }

    const fileInfo = release.files.find(
        (entry) => entry.platform === platform && entry.fileName === fileName,
    );

    if (!fileInfo) {
        return NextResponse.json(
            { error: "Requested update file not found" },
            { status: 404 },
        );
    }

    const file = releasesStore.getFileRecord(
        release.id,
        platform,
        fileInfo.kind,
    );
    if (!file || file.fileName !== fileInfo.fileName) {
        return NextResponse.json(
            { error: "Requested update file not found" },
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

    if (file.kind === "artifact") {
        releasesStore.incrementDownload(release.id, platform, "artifact");
    }

    const stream = createReadStream(filePath);
    const headers: Record<string, string> = {
        "Content-Type": file.contentType,
        "Content-Length": fileStat.size.toString(),
        "X-Release-Version": release.version,
        "X-Release-Platform": platform,
        "Content-Disposition": `attachment; filename="${file.fileName.replace(/"/g, "")}"`,
    };

    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
        headers,
    });
}
