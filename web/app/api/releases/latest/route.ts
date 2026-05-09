import { releasesStore } from "@/lib/store";
import type { Platform } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform") as Platform | null;

    if (platform && !["mac", "windows"].includes(platform)) {
        return NextResponse.json(
            { error: "Invalid platform. Use 'mac' or 'windows'" },
            { status: 400 },
        );
    }

    const release = releasesStore.getLatestEnabled(platform || undefined);

    if (!release) {
        return NextResponse.json(
            { error: "No releases available" },
            { status: 404 },
        );
    }

    // Return release info appropriate for the platform
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
        file: file
            ? {
                  fileName: file.fileName,
                  fileSize: file.fileSize,
                  downloadUrl: file.downloadUrl,
              }
            : null,
    });
}
