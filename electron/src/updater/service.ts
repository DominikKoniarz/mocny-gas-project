import { app, BrowserWindow } from "electron";
import {
    autoUpdater,
    type ProgressInfo,
    type UpdateInfo,
} from "electron-updater";
import type {
    CheckForUpdateResult,
    InstallUpdateResult,
    UpdatePlatform,
    UpdateReleaseMetadata,
    UpdateStatus,
} from "./types";

const UPDATE_STATUS_CHANNEL = "update:status";

function getUpdateServerUrl(): string {
    return (
        import.meta.env.VITE_SERVER_URL ||
        process.env.VITE_SERVER_URL ||
        "http://localhost:3000"
    ).replace(/\/$/, "");
}

function resolvePlatform(): UpdatePlatform | null {
    if (process.platform === "darwin") return "mac";
    if (process.platform === "win32") return "windows";
    return null;
}

function getCurrentVersion(): string {
    return app.getVersion();
}

function formatReleaseNotes(
    notes: UpdateInfo["releaseNotes"],
): string | undefined {
    if (!notes) return undefined;
    if (typeof notes === "string") return notes;
    if (Array.isArray(notes)) {
        return notes
            .map((entry) => entry.note)
            .filter(Boolean)
            .join("\n\n");
    }
    return undefined;
}

function toReleaseMetadata(info?: UpdateInfo): UpdateReleaseMetadata | null {
    if (!info) return null;
    const primaryFile = info.files?.[0];
    return {
        version: info.version,
        releaseNotes: formatReleaseNotes(info.releaseNotes),
        releaseDate: info.releaseDate,
        fileName: primaryFile?.url,
        fileSize: primaryFile?.size,
    };
}

function isSecureUrl(url: string): boolean {
    return url.startsWith("https://");
}

export class UpdateService {
    private status: UpdateStatus;
    private release: UpdateReleaseMetadata | null = null;
    private feedConfigured = false;

    constructor(private readonly getWindow: () => BrowserWindow | null) {
        this.status = {
            state: "idle",
            currentVersion: getCurrentVersion(),
            platform: null,
        };
        this.configureAutoUpdater();
    }

    getStatus(): UpdateStatus {
        return this.status;
    }

    async checkForUpdate(): Promise<CheckForUpdateResult> {
        try {
            const platform = resolvePlatform();
            if (!platform) {
                throw new Error("Unsupported update platform");
            }

            this.configureFeed(platform);
            await autoUpdater.checkForUpdates();

            return {
                updateAvailable: this.status.state === "available",
                status: this.status,
                release: this.release ?? undefined,
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
            const platform = resolvePlatform();
            if (!platform) {
                throw new Error("Unsupported update platform");
            }

            this.configureFeed(platform);

            if (this.status.state !== "available") {
                const check = await this.checkForUpdate();
                if (!check.updateAvailable) {
                    return {
                        started: false,
                        status: this.status,
                    };
                }
            }

            this.setStatus({
                state: "downloading",
                platform,
                latestVersion: this.release?.version,
                releaseNotes: this.release?.releaseNotes,
                releaseDate: this.release?.releaseDate,
                progress: 0,
            });

            autoUpdater.downloadUpdate().catch((error) => this.fail(error));

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

    private configureAutoUpdater(): void {
        autoUpdater.autoDownload = false;
        autoUpdater.autoInstallOnAppQuit = false;
        autoUpdater.allowPrerelease = false;

        autoUpdater.on("checking-for-update", () => {
            this.setStatus({
                state: "checking",
                platform: resolvePlatform(),
                error: undefined,
            });
        });

        autoUpdater.on("update-available", (info) => {
            this.release = toReleaseMetadata(info);
            this.setStatus({
                state: "available",
                platform: resolvePlatform(),
                latestVersion: info.version,
                releaseNotes: formatReleaseNotes(info.releaseNotes),
                releaseDate: info.releaseDate,
            });
        });

        autoUpdater.on("update-not-available", (info) => {
            this.release = toReleaseMetadata(info);
            this.setStatus({
                state: "up-to-date",
                platform: resolvePlatform(),
                latestVersion: info.version,
                releaseNotes: formatReleaseNotes(info.releaseNotes),
                releaseDate: info.releaseDate,
            });
        });

        autoUpdater.on("download-progress", (progress: ProgressInfo) => {
            this.setStatus({
                state: "downloading",
                platform: resolvePlatform(),
                latestVersion: this.release?.version,
                releaseNotes: this.release?.releaseNotes,
                releaseDate: this.release?.releaseDate,
                progress: Math.round(progress.percent),
            });
        });

        autoUpdater.on("update-downloaded", (info) => {
            this.release = toReleaseMetadata(info);
            this.setStatus({
                state: "installing",
                platform: resolvePlatform(),
                latestVersion: info.version,
                releaseNotes: formatReleaseNotes(info.releaseNotes),
                releaseDate: info.releaseDate,
                progress: 100,
            });
            autoUpdater.quitAndInstall();
        });

        autoUpdater.on("error", (error) => {
            this.fail(error);
        });
    }

    private configureFeed(platform: UpdatePlatform): void {
        if (this.feedConfigured) return;

        const serverUrl = getUpdateServerUrl();
        if (app.isPackaged && !isSecureUrl(serverUrl)) {
            throw new Error(
                "Updates require an HTTPS update server for security. Check VITE_SERVER_URL.",
            );
        }

        const feedUrl = `${serverUrl}/api/updates/${platform}`;
        autoUpdater.setFeedURL({ provider: "generic", url: feedUrl });
        if (!app.isPackaged) {
            autoUpdater.forceDevUpdateConfig = true;
        }

        this.feedConfigured = true;
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
