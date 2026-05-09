import {
    releaseIdParamsSchema,
    uploadFormSchema,
    validationError,
} from "@/lib/api/validation";
import {
    SigningConfigurationError,
    signReleasePayload,
} from "@/lib/signing";
import { releasesStore } from "@/lib/store";
import type { Platform } from "@/lib/types";
import { createHash, randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

const validExtensionsByPlatform: Record<Platform, string[]> = {
    mac: [".dmg", ".zip"],
    windows: [".exe", ".msi", ".nupkg"],
};

const contentTypesByExtension: Record<string, string> = {
    ".dmg": "application/x-apple-diskimage",
    ".exe": "application/vnd.microsoft.portable-executable",
    ".msi": "application/x-msi",
    ".nupkg": "application/zip",
    ".zip": "application/zip",
};

function sanitizeFileName(fileName: string): string {
    return path
        .basename(fileName)
        .replace(/[^a-zA-Z0-9._-]/g, "-")
        .replace(/-+/g, "-");
}

export async function POST(
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

    const { id } = parsedParams.data;
    const release = releasesStore.getById(id);

    if (!release) {
        return NextResponse.json(
            { error: "Release not found" },
            { status: 404 },
        );
    }

    const formData = await request.formData();
    const parsedForm = uploadFormSchema.safeParse({
        file: formData.get("file"),
        platform: formData.get("platform"),
    });
    if (!parsedForm.success) {
        return NextResponse.json(
            validationError(parsedForm.error),
            { status: 400 },
        );
    }

    const { file, platform } = parsedForm.data;

    const fileName = sanitizeFileName(file.name);
    const extension = path.extname(fileName).toLowerCase();
    const validExtensions = validExtensionsByPlatform[platform];

    if (!validExtensions.includes(extension)) {
        return NextResponse.json(
            {
                error: `Invalid file type. Expected: ${validExtensions.join(", ")}`,
            },
            { status: 400 },
        );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const sha256 = createHash("sha256").update(buffer).digest("hex");
    const contentType =
        contentTypesByExtension[extension] ||
        file.type ||
        "application/octet-stream";
    let signature;

    try {
        signature = signReleasePayload({
            releaseId: release.id,
            version: release.version,
            platform,
            fileName,
            fileSize: file.size,
            sha256,
        });
    } catch (error) {
        if (error instanceof SigningConfigurationError) {
            return NextResponse.json(
                { error: error.message },
                { status: 503 },
            );
        }

        return NextResponse.json(
            { error: "Failed to sign release artifact" },
            { status: 500 },
        );
    }

    const storageRoot = path.join(process.cwd(), "storage", "releases");
    const storageDir = path.join(storageRoot, release.id);
    const storedFileName = `${platform}-${randomUUID()}${extension}`;
    const storagePath = path.join(release.id, storedFileName);
    const filePath = path.join(storageDir, storedFileName);

    await mkdir(storageDir, { recursive: true });
    await writeFile(filePath, buffer);

    const downloadUrl = `/api/releases/download/${release.id}?platform=${platform}`;
    releasesStore.setFile(id, platform, {
        fileName,
        fileSize: file.size,
        storagePath,
        contentType,
        sha256,
        signature: signature.signature,
        signatureAlgorithm: signature.signatureAlgorithm,
        signedAt: signature.signedAt,
        signingKeyId: signature.signingKeyId,
        downloadUrl,
    });

    return NextResponse.json({
        success: true,
        fileName,
        fileSize: file.size,
        contentType,
        sha256,
        signature: signature.signature,
        signatureAlgorithm: signature.signatureAlgorithm,
        signedAt: signature.signedAt,
        signingKeyId: signature.signingKeyId,
        downloadUrl,
    });
}
