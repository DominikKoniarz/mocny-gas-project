import { releasesStore } from "@/lib/store";
import type { Platform } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ version: string }> },
) {
    const { version } = await params;
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform") as Platform | null;

    const release = releasesStore.getByVersion(version);

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

    const file =
        platform === "mac"
            ? release.macFile
            : platform === "windows"
              ? release.windowsFile
              : null;

    return NextResponse.json({
        version: release.version,
        releaseNotes: release.releaseNotes,
        releaseDate: release.createdAt,
        isEnabled: release.isEnabled,
        file: file
            ? {
                  fileName: file.fileName,
                  fileSize: file.fileSize,
                  downloadUrl: file.downloadUrl,
              }
            : null,
    });
}
