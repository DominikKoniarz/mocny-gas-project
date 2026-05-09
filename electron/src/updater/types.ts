export type UpdatePlatform = "mac" | "windows";

export type UpdateState =
    | "idle"
    | "checking"
    | "available"
    | "downloading"
    | "installing"
    | "failed"
    | "up-to-date";

export interface UpdateReleaseMetadata {
    version: string;
    releaseNotes?: string;
    releaseDate?: string;
    fileName?: string;
    fileSize?: number;
}

export interface UpdateStatus {
    state: UpdateState;
    currentVersion: string;
    platform: UpdatePlatform | null;
    latestVersion?: string;
    releaseNotes?: string;
    releaseDate?: string;
    progress?: number;
    error?: string;
}

export interface CheckForUpdateResult {
    updateAvailable: boolean;
    status: UpdateStatus;
    release?: UpdateReleaseMetadata;
}

export interface InstallUpdateResult {
    started: boolean;
    status: UpdateStatus;
}
