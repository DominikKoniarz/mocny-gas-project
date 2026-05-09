import {
    platformQuerySchema,
    releaseVersionParamsSchema,
    validationError,
} from "@/lib/api/validation";
import { hasUsableSignatureMetadata } from "@/lib/signing";
import { releasesStore } from "@/lib/store";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ version: string }> },
) {
    const parsedParams = releaseVersionParamsSchema.safeParse(await params);
    if (!parsedParams.success) {
        return NextResponse.json(
            validationError(parsedParams.error),
            { status: 400 },
        );
    }

    const { searchParams } = new URL(request.url);
    const parsedQuery = platformQuerySchema.safeParse(
        Object.fromEntries(searchParams),
    );

    if (!parsedQuery.success) {
        return NextResponse.json(
            validationError(parsedQuery.error),
            { status: 400 },
        );
    }

    const { version } = parsedParams.data;
    const { platform } = parsedQuery.data;
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

    const file = platform === "mac" ? release.macFile : release.windowsFile;

    if (!file || !hasUsableSignatureMetadata(file)) {
        return NextResponse.json(
            { error: `No signed ${platform} file available for this release` },
            { status: 404 },
        );
    }

    return NextResponse.json({
        version: release.version,
        releaseNotes: release.releaseNotes,
        releaseDate: release.createdAt,
        isEnabled: release.isEnabled,
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
