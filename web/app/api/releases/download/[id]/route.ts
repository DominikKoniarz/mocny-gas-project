import { releasesStore } from "@/lib/store";
import type { Platform } from "@/lib/types";
import { NextResponse } from "next/server";

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

    const file = platform === "mac" ? release.macFile : release.windowsFile;

    if (!file) {
        return NextResponse.json(
            { error: `No ${platform} file available for this release` },
            { status: 404 },
        );
    }

    // Increment download count
    releasesStore.incrementDownload(id, platform);

    // Return download URL for client to fetch
    return NextResponse.json({
        version: release.version,
        platform,
        fileName: file.fileName,
        fileSize: file.fileSize,
        downloadUrl: file.downloadUrl,
    });
}
