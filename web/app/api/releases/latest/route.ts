import {
    latestReleaseQuerySchema,
    validationError,
} from "@/lib/api/validation";
import { hasUsableSignatureMetadata } from "@/lib/signing";
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
    const release = releasesStore.getLatestEnabled(platform, {
        requireSigned: true,
    });

    if (!release) {
        return NextResponse.json(
            { error: `No ${platform} release available` },
            { status: 404 },
        );
    }

    const file = platform === "mac" ? release.macFile : release.windowsFile;

    if (!file || !hasUsableSignatureMetadata(file)) {
        return NextResponse.json(
            { error: `No signed ${platform} file available` },
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
