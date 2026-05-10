import { platformSchema, validationError } from "@/lib/api/validation";
import { releasesStore } from "@/lib/store";
import {
    RELEASES_STORAGE_ROOT,
    isSafeStoragePath,
} from "@/lib/updates/storage";
import { readFile, stat } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ platform: string }> },
) {
    const parsed = platformSchema.safeParse((await params).platform);
    if (!parsed.success) {
        return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const platform = parsed.data;
    if (platform !== "windows") {
        return NextResponse.json(
            { error: "Use latest-mac.yml for macOS updates" },
            { status: 404 },
        );
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

    const file = releasesStore.getFileRecord(release.id, platform, "metadata");
    if (!file) {
        return NextResponse.json(
            { error: "No update metadata available" },
            { status: 404 },
        );
    }

    const filePath = path.resolve(RELEASES_STORAGE_ROOT, file.storagePath);
    if (!isSafeStoragePath(filePath)) {
        return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    let fileStat;
    try {
        fileStat = await stat(filePath);
    } catch {
        return NextResponse.json(
            { error: "Metadata file not found" },
            { status: 404 },
        );
    }

    let content: Buffer;
    try {
        content = await readFile(filePath);
    } catch {
        return NextResponse.json(
            { error: "Metadata file not found" },
            { status: 404 },
        );
    }

    return new NextResponse(content as BodyInit, {
        headers: {
            "Content-Type": file.contentType || "text/yaml",
            "Content-Length": fileStat.size.toString(),
            "Cache-Control": "no-cache",
        },
    });
}
