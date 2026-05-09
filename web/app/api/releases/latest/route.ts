import {
    latestReleaseQuerySchema,
    validationError,
} from "@/lib/api/validation";
import { releasesStore } from "@/lib/store";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const parsedQuery = latestReleaseQuerySchema.safeParse(
        Object.fromEntries(searchParams),
    );

    if (!parsedQuery.success) {
        return NextResponse.json(
            validationError(parsedQuery.error),
            { status: 400 },
        );
    }

    const { platform } = parsedQuery.data;
    const release = releasesStore.getLatestEnabled(platform);

    if (!release) {
        return NextResponse.json(
            { error: `No ${platform} release available` },
            { status: 404 },
        );
    }

    const file = release.files.find(
        (entry) => entry.platform === platform && entry.kind === "artifact",
    );

    if (!file) {
        return NextResponse.json(
            { error: `No ${platform} file available` },
            { status: 404 },
        );
    }

    return NextResponse.json({
        version: release.version,
        releaseNotes: release.releaseNotes,
        releaseDate: release.createdAt,
        file: {
            fileName: file.fileName,
            fileSize: file.fileSize,
            contentType: file.contentType,
            sha256: file.sha256,
            signature: file.signature,
            signatureAlgorithm: file.signatureAlgorithm,
            signedAt: file.signedAt,
            signingKeyId: file.signingKeyId,
            downloadUrl: file.downloadUrl,
        },
    });
}
