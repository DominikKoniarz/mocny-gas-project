export type UpdatePlatform = "mac" | "windows";

export type UpdateState =
    | "idle"
    | "checking"
    | "available"
    | "downloading"
    | "verifying"
    | "installing"
    | "failed"
    | "up-to-date";

export interface UpdateFileMetadata {
    fileName: string;
    fileSize: number;
    contentType: string;
    sha256: string;
    signature: string;
    signatureAlgorithm: "Ed25519";
    signedAt: string;
    signingKeyId: string | null;
    downloadUrl: string;
}

export interface UpdateReleaseMetadata {
    version: string;
    releaseNotes: string;
    releaseDate: string;
    file: UpdateFileMetadata;
}

export interface UpdateStatus {
    state: UpdateState;
    currentVersion: string;
    platform: UpdatePlatform | null;
    latestVersion?: string;
    releaseNotes?: string;
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
