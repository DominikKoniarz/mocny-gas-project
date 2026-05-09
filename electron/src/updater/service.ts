import { app, BrowserWindow } from "electron";
import { Buffer } from "buffer";
import { spawn } from "child_process";
import {
    createHash,
    createPublicKey,
    timingSafeEqual,
    verify as cryptoVerify,
} from "crypto";
import { createReadStream, createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import type { ReadableStream as NodeReadableStream } from "stream/web";
import { UPDATE_SIGNING_PUBLIC_KEY_PEM } from "./public-key";
import type {
    CheckForUpdateResult,
    InstallUpdateResult,
    UpdatePlatform,
    UpdateReleaseMetadata,
    UpdateStatus,
} from "./types";

const UPDATE_STATUS_CHANNEL = "update:status";
const SIGNATURE_ALGORITHM = "Ed25519";

function getUpdateServerUrl(): string {
    return (
        import.meta.env.VITE_SERVER_URL ||
        process.env.VITE_SERVER_URL ||
        "http://localhost:3000"
    ).replace(/\/$/, "");
}

function getPlatform(): UpdatePlatform {
    if (process.platform === "darwin") return "mac";
    if (process.platform === "win32") return "windows";
    throw new Error(`Unsupported update platform: ${process.platform}`);
}

function getCurrentVersion(): string {
    return app.getVersion();
}

function compareSemver(a: string, b: string): number {
    const aParts = a.split(".").map(Number);
    const bParts = b.split(".").map(Number);

    for (let index = 0; index < 3; index++) {
        const diff = (aParts[index] ?? 0) - (bParts[index] ?? 0);
        if (diff !== 0) return diff;
    }

    return 0;
}

function canonicalizeReleasePayload(
    release: UpdateReleaseMetadata,
    platform: UpdatePlatform,
): string {
    return JSON.stringify({
        fileName: release.file.fileName,
        fileSize: release.file.fileSize,
        platform,
        releaseId: release.file.downloadUrl
            .split("/api/releases/download/")[1]
            ?.split("?")[0],
        sha256: release.file.sha256,
        version: release.version,
    });
}

function validateReleaseMetadata(
    value: unknown,
): UpdateReleaseMetadata | undefined {
    if (!value || typeof value !== "object") return undefined;

    const release = value as Partial<UpdateReleaseMetadata>;
    const file = release.file;

    if (
        typeof release.version !== "string" ||
        typeof release.releaseNotes !== "string" ||
        typeof release.releaseDate !== "string" ||
        !file ||
        typeof file.fileName !== "string" ||
        typeof file.fileSize !== "number" ||
        typeof file.contentType !== "string" ||
        typeof file.sha256 !== "string" ||
        typeof file.signature !== "string" ||
        file.signatureAlgorithm !== SIGNATURE_ALGORITHM ||
        typeof file.signedAt !== "string" ||
        typeof file.downloadUrl !== "string"
    ) {
        return undefined;
    }

    return release as UpdateReleaseMetadata;
}

function resolveDownloadUrl(serverUrl: string, downloadUrl: string): string {
    return new URL(downloadUrl, serverUrl).toString();
}

async function hashFile(filePath: string): Promise<string> {
    const hash = createHash("sha256");

    await pipeline(createReadStream(filePath), hash);

    return hash.digest("hex");
}

function assertHashMatches(actual: string, expected: string): void {
    const actualBuffer = Buffer.from(actual, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");

    if (
        actualBuffer.length !== expectedBuffer.length ||
        !timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
        throw new Error("Downloaded artifact hash mismatch");
    }
}

function verifySignature(
    release: UpdateReleaseMetadata,
    platform: UpdatePlatform,
): void {
    const canonicalPayload = canonicalizeReleasePayload(release, platform);
    const publicKey = createPublicKey(UPDATE_SIGNING_PUBLIC_KEY_PEM);
    const isValid = cryptoVerify(
        null,
        Buffer.from(canonicalPayload, "utf8"),
        publicKey,
        Buffer.from(release.file.signature, "base64"),
    );

    if (!isValid) {
        throw new Error("Downloaded artifact signature is invalid");
    }
}

function spawnInstaller(filePath: string): void {
    const extension = path.extname(filePath).toLowerCase();
    const command =
        process.platform === "darwin"
            ? "open"
            : extension === ".msi"
              ? "msiexec"
              : filePath;
    const args =
        process.platform === "darwin"
            ? [filePath]
            : extension === ".msi"
              ? ["/i", filePath]
              : [];

    const child = spawn(command, args, {
        detached: true,
        stdio: "ignore",
        windowsHide: false,
    });
    child.unref();
}

export class UpdateService {
    private status: UpdateStatus;
    private release: UpdateReleaseMetadata | null = null;

    constructor(private readonly getWindow: () => BrowserWindow | null) {
        this.status = {
            state: "idle",
            currentVersion: getCurrentVersion(),
            platform: null,
        };
    }

    getStatus(): UpdateStatus {
        return this.status;
    }

    async checkForUpdate(): Promise<CheckForUpdateResult> {
        try {
            const platform = getPlatform();
            this.setStatus({ state: "checking", platform, error: undefined });

            const response = await fetch(
                `${getUpdateServerUrl()}/api/releases/latest?platform=${platform}`,
            );

            if (response.status === 404) {
                this.release = null;
                this.setStatus({ state: "up-to-date", platform });
                return {
                    updateAvailable: false,
                    status: this.status,
                };
            }

            if (!response.ok) {
                throw new Error(`Update check failed: ${response.status}`);
            }

            const release = validateReleaseMetadata(await response.json());
            if (!release) {
                throw new Error("Update metadata response is invalid");
            }

            const isNewer =
                compareSemver(release.version, getCurrentVersion()) > 0;
            if (!isNewer) {
                this.release = null;
                this.setStatus({
                    state: "up-to-date",
                    platform,
                    latestVersion: release.version,
                    releaseNotes: release.releaseNotes,
                });
                return {
                    updateAvailable: false,
                    status: this.status,
                    release,
                };
            }

            this.release = release;
            this.setStatus({
                state: "available",
                platform,
                latestVersion: release.version,
                releaseNotes: release.releaseNotes,
            });

            return {
                updateAvailable: true,
                status: this.status,
                release,
            };
        } catch (error) {
            this.fail(error);
            return {
                updateAvailable: false,
                status: this.status,
            };
        }
    }

    async downloadAndInstallUpdate(): Promise<InstallUpdateResult> {
        try {
            if (!this.release) {
                const check = await this.checkForUpdate();
                if (!check.updateAvailable || !check.release) {
                    return {
                        started: false,
                        status: this.status,
                    };
                }
            }

            const release = this.release!;
            const platform = getPlatform();
            const cacheDir = path.join(
                app.getPath("userData"),
                "updates",
                release.version,
            );
            const artifactPath = path.join(cacheDir, release.file.fileName);

            await mkdir(cacheDir, { recursive: true });
            this.setStatus({
                state: "downloading",
                platform,
                latestVersion: release.version,
                releaseNotes: release.releaseNotes,
                progress: 0,
            });

            const response = await fetch(
                resolveDownloadUrl(getUpdateServerUrl(), release.file.downloadUrl),
            );
            if (!response.ok || !response.body) {
                throw new Error(`Update download failed: ${response.status}`);
            }

            const downloadStream = Readable.fromWeb(
                response.body as unknown as NodeReadableStream<Uint8Array>,
            );
            await pipeline(
                downloadStream,
                createWriteStream(artifactPath),
            );

            this.setStatus({
                state: "verifying",
                platform,
                latestVersion: release.version,
                releaseNotes: release.releaseNotes,
                progress: 100,
            });

            const sha256 = await hashFile(artifactPath);
            assertHashMatches(sha256, release.file.sha256);
            verifySignature(release, platform);

            this.setStatus({
                state: "installing",
                platform,
                latestVersion: release.version,
                releaseNotes: release.releaseNotes,
                progress: 100,
            });
            spawnInstaller(artifactPath);
            app.quit();

            return {
                started: true,
                status: this.status,
            };
        } catch (error) {
            this.fail(error);
            return {
                started: false,
                status: this.status,
            };
        }
    }

    private setStatus(update: Partial<UpdateStatus>): void {
        this.status = {
            ...this.status,
            ...update,
            currentVersion: getCurrentVersion(),
        };
        this.getWindow()?.webContents.send(UPDATE_STATUS_CHANNEL, this.status);
    }

    private fail(error: unknown): void {
        this.setStatus({
            state: "failed",
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown update error",
        });
    }
}

export { UPDATE_STATUS_CHANNEL };
