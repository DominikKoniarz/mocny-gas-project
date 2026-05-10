import {
    releaseIdParamsSchema,
    uploadFormSchema,
    validationError,
} from "@/lib/api/validation";
import { releasesStore } from "@/lib/store";
import type { Platform, ReleaseFileKind } from "@/lib/types";
import { createHash } from "crypto";
import { createReadStream } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import { pipeline } from "stream/promises";
import { parse as parseYaml } from "yaml";

const metadataFileNameByPlatform: Record<Platform, string> = {
    mac: "latest-mac.yml",
    windows: "latest.yml",
};

const requiredExtensions: Record<Platform, Record<ReleaseFileKind, string[]>> = {
    mac: {
        metadata: [".yml"],
        artifact: [".zip"],
        blockmap: [".zip.blockmap"],
    },
    windows: {
        metadata: [".yml"],
        artifact: [".exe"],
        blockmap: [".exe.blockmap"],
    },
};

const contentTypesByExtension: Record<string, string> = {
    ".blockmap": "application/octet-stream",
    ".dmg": "application/x-apple-diskimage",
    ".exe": "application/vnd.microsoft.portable-executable",
    ".msi": "application/x-msi",
    ".nupkg": "application/zip",
    ".yml": "text/yaml",
    ".zip": "application/zip",
};

function isSafeFileName(fileName: string): boolean {
    return (
        fileName === path.basename(fileName) &&
        !fileName.includes("..") &&
        !fileName.includes("/") &&
        !fileName.includes("\\")
    );
}

function matchesExtension(fileName: string, extensions: string[]): boolean {
    const lower = fileName.toLowerCase();
    return extensions.some((ext) => lower.endsWith(ext));
}

async function hashFile(
    filePath: string,
    algorithm: "sha256" | "sha512",
    encoding: "hex" | "base64",
): Promise<string> {
    const hash = createHash(algorithm);
    await pipeline(createReadStream(filePath), hash);
    return hash.digest(encoding);
}

type ParsedUpdateMetadata = {
    version?: string;
    artifactName: string;
    artifactSha512?: string;
    blockmapName: string;
    blockmapSha512?: string;
};

function parseUpdateMetadata(
    payload: string,
    platform: Platform,
): ParsedUpdateMetadata {
    const data = parseYaml(payload);
    if (!data || typeof data !== "object") {
        throw new Error("Update metadata must be a YAML object");
    }

    const record = data as Record<string, unknown>;
    const version = typeof record.version === "string" ? record.version : undefined;
    const pathValue = typeof record.path === "string" ? record.path : undefined;
    const files = Array.isArray(record.files) ? record.files : [];

    const fileEntries = files.filter(
        (entry) =>
            entry &&
            typeof entry === "object" &&
            typeof (entry as { url?: string }).url === "string",
    ) as Array<{ url: string; sha512?: string }>;

    const fileUrls = fileEntries.map((entry) => entry.url);
    fileUrls.forEach((url) => {
        if (!isSafeFileName(url)) {
            throw new Error("Update metadata contains invalid file paths");
        }
    });

    const artifactName =
        pathValue ||
        fileUrls.find((url) => !url.toLowerCase().endsWith(".blockmap"));
    const blockmapName = fileUrls.find((url) =>
        url.toLowerCase().endsWith(".blockmap"),
    );

    if (!artifactName || !blockmapName) {
        throw new Error("Update metadata is missing required file references");
    }

    if (!isSafeFileName(artifactName) || !isSafeFileName(blockmapName)) {
        throw new Error("Update metadata contains invalid file paths");
    }

    if (!matchesExtension(artifactName, requiredExtensions[platform].artifact)) {
        throw new Error(
            `Update metadata artifact must be ${requiredExtensions[platform].artifact.join(", ")} for ${platform}`,
        );
    }

    if (!matchesExtension(blockmapName, requiredExtensions[platform].blockmap)) {
        throw new Error(
            `Update metadata blockmap must be ${requiredExtensions[platform].blockmap.join(", ")} for ${platform}`,
        );
    }

    const artifactEntry = fileEntries.find((entry) => entry.url === artifactName);
    const blockmapEntry = fileEntries.find((entry) => entry.url === blockmapName);

    const artifactSha512 =
        artifactEntry?.sha512 ||
        (typeof record.sha512 === "string" ? record.sha512 : undefined);
    const blockmapSha512 = blockmapEntry?.sha512;

    return {
        version,
        artifactName,
        artifactSha512,
        blockmapName,
        blockmapSha512,
    };
}

type StoredFileInfo = {
    fileName: string;
    storagePath: string;
};

async function validateMetadataUpload({
    file,
    platform,
    releaseVersion,
    artifact,
    blockmap,
}: {
    file: File;
    platform: Platform;
    releaseVersion: string;
    artifact: StoredFileInfo;
    blockmap: StoredFileInfo;
}): Promise<string | null> {
    const text = await file.text();
    let parsedMetadata: ParsedUpdateMetadata;
    try {
        parsedMetadata = parseUpdateMetadata(text, platform);
    } catch (error) {
        return error instanceof Error
            ? error.message
            : "Invalid update metadata file";
    }

    if (parsedMetadata.version && parsedMetadata.version !== releaseVersion) {
        return "Metadata version does not match the release version";
    }

    if (
        parsedMetadata.artifactName !== artifact.fileName ||
        parsedMetadata.blockmapName !== blockmap.fileName
    ) {
        return "Metadata file names must match the uploaded artifact and blockmap";
    }

    if (!parsedMetadata.artifactSha512 || !parsedMetadata.blockmapSha512) {
        return "Metadata must include SHA-512 checksums";
    }

    const storageRoot = path.join(process.cwd(), "storage", "releases");
    const artifactPath = path.join(storageRoot, artifact.storagePath);
    const blockmapPath = path.join(storageRoot, blockmap.storagePath);

    let artifactSha512: string;
    let blockmapSha512: string;
    try {
        [artifactSha512, blockmapSha512] = await Promise.all([
            hashFile(artifactPath, "sha512", "base64"),
            hashFile(blockmapPath, "sha512", "base64"),
        ]);
    } catch {
        return "Failed to verify checksum for stored files";
    }

    if (artifactSha512 !== parsedMetadata.artifactSha512) {
        return "Artifact checksum does not match metadata";
    }

    if (blockmapSha512 !== parsedMetadata.blockmapSha512) {
        return "Blockmap checksum does not match metadata";
    }

    return null;
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
        kind: formData.get("kind"),
    });
    if (!parsedForm.success) {
        return NextResponse.json(
            validationError(parsedForm.error),
            { status: 400 },
        );
    }

    const { file, platform, kind } = parsedForm.data;
    const fileName = file.name;

    if (!isSafeFileName(fileName)) {
        return NextResponse.json(
            { error: "Invalid file name" },
            { status: 400 },
        );
    }

    const expectedMetadataName = metadataFileNameByPlatform[platform];
    if (kind === "metadata" && fileName !== expectedMetadataName) {
        return NextResponse.json(
            {
                error: `Metadata file must be named ${expectedMetadataName}`,
            },
            { status: 400 },
        );
    }

    if (!matchesExtension(fileName, requiredExtensions[platform][kind])) {
        return NextResponse.json(
            {
                error: `Invalid file type. Expected: ${requiredExtensions[platform][kind].join(", ")}`,
            },
            { status: 400 },
        );
    }

    // Enforce upload order: artifact -> blockmap -> metadata (metadata validates prior files).
    if (kind === "blockmap") {
        const artifact = releasesStore.getFileRecord(id, platform, "artifact");
        if (!artifact) {
            return NextResponse.json(
                { error: "Upload the artifact file before the blockmap" },
                { status: 400 },
            );
        }

        const artifactExtension = path.extname(artifact.fileName);
        const expectedSuffix = `${artifactExtension}.blockmap`;
        if (!fileName.toLowerCase().endsWith(expectedSuffix.toLowerCase())) {
            return NextResponse.json(
                {
                    error: `Blockmap file must end with ${expectedSuffix}`,
                },
                { status: 400 },
            );
        }
    }

    if (kind === "metadata") {
        const artifact = releasesStore.getFileRecord(id, platform, "artifact");
        const blockmap = releasesStore.getFileRecord(id, platform, "blockmap");

        if (!artifact || !blockmap) {
            return NextResponse.json(
                { error: "Upload the artifact and blockmap before metadata" },
                { status: 400 },
            );
        }

        const validationError = await validateMetadataUpload({
            file,
            platform,
            releaseVersion: release.version,
            artifact,
            blockmap,
        });
        if (validationError) {
            return NextResponse.json(
                { error: validationError },
                { status: 400 },
            );
        }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const sha256 = createHash("sha256").update(buffer).digest("hex");
    const contentType =
        contentTypesByExtension[path.extname(fileName).toLowerCase()] ||
        file.type ||
        "application/octet-stream";

    const storageRoot = path.join(process.cwd(), "storage", "releases");
    const storageDir = path.join(storageRoot, release.id);
    const storagePath = path.join(release.id, fileName);
    const filePath = path.join(storageDir, fileName);

    await mkdir(storageDir, { recursive: true });
    await writeFile(filePath, buffer);

    const downloadUrl = `/api/updates/${platform}/${encodeURIComponent(fileName)}`;
    releasesStore.setFile(id, platform, kind, {
        fileName,
        fileSize: file.size,
        storagePath,
        contentType,
        sha256,
        signature: null,
        signatureAlgorithm: null,
        signedAt: null,
        signingKeyId: null,
        downloadUrl,
    });

    return NextResponse.json({
        success: true,
        fileName,
        fileSize: file.size,
        contentType,
        sha256,
        kind,
        platform,
        downloadUrl,
    });
}
