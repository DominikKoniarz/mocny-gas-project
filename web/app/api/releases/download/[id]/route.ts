import {
    platformQuerySchema,
    releaseIdParamsSchema,
    validationError,
} from "@/lib/api/validation";
import { releasesStore } from "@/lib/store";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import { Readable } from "stream";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const parsedParams = releaseIdParamsSchema.safeParse(await params);
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

    const { id } = parsedParams.data;
    const { platform } = parsedQuery.data;
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

    const file = releasesStore.getFileRecord(id, platform, "artifact");

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

    releasesStore.incrementDownload(id, platform, "artifact");

    const stream = createReadStream(filePath);

    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
        headers: {
            "Content-Type": file.contentType,
            "Content-Length": fileStat.size.toString(),
            "Content-Disposition": `attachment; filename="${file.fileName.replace(/"/g, "")}"`,
            "X-Release-Version": release.version,
            "X-Release-Platform": platform,
        },
    });
}
