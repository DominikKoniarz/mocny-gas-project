import { useEffect, useMemo, useState } from "react";
import type {
    CheckForUpdateResult,
    UpdateReleaseMetadata,
    UpdateState,
    UpdateStatus,
} from "./updater/types";

const stateLabels: Record<UpdateState, string> = {
    idle: "Ready",
    checking: "Checking",
    available: "Update available",
    downloading: "Downloading",
    verifying: "Verifying",
    installing: "Installing",
    failed: "Failed",
    "up-to-date": "Up to date",
};

const busyStates: UpdateState[] = [
    "checking",
    "downloading",
    "verifying",
    "installing",
];

function formatBytes(bytes?: number): string {
    if (!bytes) return "Unknown size";

    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }

    return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function releaseDate(release?: UpdateReleaseMetadata): string {
    if (!release) return "No release loaded";

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(release.releaseDate));
}

function primaryLabel(status: UpdateStatus): string {
    if (status.state === "available") return "Install update";
    if (status.state === "failed") return "Retry check";
    if (status.state === "up-to-date") return "Check again";
    if (busyStates.includes(status.state)) return stateLabels[status.state];

    return "Check for updates";
}

export default function App() {
    const [status, setStatus] = useState<UpdateStatus>({
        state: "idle",
        currentVersion: __APP_VERSION__,
        platform: null,
    });
    const [release, setRelease] = useState<UpdateReleaseMetadata | undefined>();

    const isBusy = busyStates.includes(status.state);
    const progress = status.progress ?? 0;
    const canInstall = status.state === "available";

    const secondaryText = useMemo(() => {
        if (status.state === "available") {
            return `Version ${status.latestVersion} is signed and ready to install.`;
        }
        if (status.state === "up-to-date") {
            return "You already have the latest available version.";
        }
        if (status.state === "failed") {
            return status.error ?? "Update failed.";
        }
        if (status.state === "idle") {
            return "Secure updates verify hash and Ed25519 signature before install.";
        }

        return "Do not close the app while update work is in progress.";
    }, [status]);

    useEffect(() => {
        window.api.getUpdateStatus().then(setStatus);
        return window.api.onUpdateStatus(setStatus);
    }, []);

    async function handlePrimaryAction(): Promise<void> {
        if (isBusy) return;

        if (canInstall) {
            const result = await window.api.downloadAndInstallUpdate();
            setStatus(result.status);
            return;
        }

        const result: CheckForUpdateResult = await window.api.checkForUpdate();
        setStatus(result.status);
        setRelease(result.release);
    }

    return (
        <main className="bg-background flex h-full items-center justify-center p-6">
            <section className="border-border bg-card text-card-foreground w-full max-w-2xl rounded-3xl border p-8 shadow-sm">
                <div className="flex flex-col gap-8">
                    <header className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-muted-foreground text-xs uppercase tracking-[0.3em]">
                                    Secure updater
                                </p>
                                <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                                    Mocny Gas Desktop
                                </h1>
                            </div>
                            <span className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs">
                                v{status.currentVersion}
                            </span>
                        </div>
                        <p className="text-muted-foreground text-sm leading-6">
                            Updates are fetched from the release server,
                            downloaded locally, hash checked, signature verified,
                            then handed to the OS installer.
                        </p>
                    </header>

                    <div className="bg-muted/40 rounded-2xl p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-muted-foreground text-sm">
                                    Status
                                </p>
                                <p className="mt-1 text-xl font-semibold">
                                    {stateLabels[status.state]}
                                </p>
                            </div>
                            <span className="border-border rounded-full border px-3 py-1 text-xs">
                                {status.platform ?? "platform pending"}
                            </span>
                        </div>
                        <p
                            className={`mt-4 text-sm leading-6 ${
                                status.state === "failed"
                                    ? "text-destructive"
                                    : "text-muted-foreground"
                            }`}
                        >
                            {secondaryText}
                        </p>

                        {["downloading", "verifying", "installing"].includes(
                            status.state,
                        ) && (
                            <div className="mt-5">
                                <div className="bg-secondary h-2 overflow-hidden rounded-full">
                                    <div
                                        className="bg-primary h-full transition-all"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="text-muted-foreground mt-2 text-xs">
                                    {Math.round(progress)}%
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="border-border rounded-2xl border p-4">
                            <p className="text-muted-foreground text-xs uppercase">
                                Latest
                            </p>
                            <p className="mt-2 text-lg font-medium">
                                {status.latestVersion
                                    ? `v${status.latestVersion}`
                                    : "Not checked"}
                            </p>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {releaseDate(release)}
                            </p>
                        </div>
                        <div className="border-border rounded-2xl border p-4">
                            <p className="text-muted-foreground text-xs uppercase">
                                Artifact
                            </p>
                            <p className="mt-2 truncate text-lg font-medium">
                                {release?.file.fileName ?? "None"}
                            </p>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {formatBytes(release?.file.fileSize)}
                            </p>
                        </div>
                    </div>

                    {status.releaseNotes && (
                        <div className="border-border rounded-2xl border p-4">
                            <p className="text-muted-foreground text-xs uppercase">
                                Release notes
                            </p>
                            <pre className="mt-3 whitespace-pre-wrap text-sm leading-6">
                                {status.releaseNotes}
                            </pre>
                        </div>
                    )}

                    <button
                        className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground rounded-2xl px-5 py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed"
                        disabled={isBusy}
                        onClick={handlePrimaryAction}
                    >
                        {primaryLabel(status)}
                    </button>
                </div>
            </section>
        </main>
    );
}
