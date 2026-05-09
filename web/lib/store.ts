import { and, desc, eq, gte, inArray, lte, or, sql } from "drizzle-orm";
import { db } from "./db";
import {
    releaseFiles,
    releases,
    type ReleaseFileRow,
    type ReleaseRow,
    updateLogs,
    type UpdateLogRow,
} from "./db/schema";
import type {
    CreateLogInput,
    CreateReleaseInput,
    LogFilters,
    Platform,
    Release,
    ReleaseFile,
    ReleaseFileKind,
    UpdateLog,
    UpdateReleaseInput,
} from "./types";

function generateId(): string {
    return Math.random().toString(36).substring(2, 15);
}

function toReleaseFile(row: ReleaseFileRow): ReleaseFile {
    return {
        fileName: row.fileName,
        fileSize: row.fileSize,
        contentType: row.contentType,
        sha256: row.sha256,
        signature: row.signature,
        signatureAlgorithm: row.signatureAlgorithm,
        signedAt: row.signedAt,
        signingKeyId: row.signingKeyId,
        downloadUrl: row.downloadUrl,
        downloadCount: row.downloadCount,
        platform: row.platform,
        kind: row.kind,
    };
}

function toRelease(row: ReleaseRow, files: ReleaseFileRow[] = []): Release {
    return {
        id: row.id,
        version: row.version,
        releaseNotes: row.releaseNotes,
        createdAt: row.createdAt,
        isEnabled: row.isEnabled,
        files: files.map(toReleaseFile),
    };
}

function toUpdateLog(row: UpdateLogRow): UpdateLog {
    return {
        id: row.id,
        timestamp: row.timestamp,
        clientId: row.clientId,
        fromVersion: row.fromVersion,
        toVersion: row.toVersion,
        platform: row.platform,
        status: row.status,
        errorMessage: row.errorMessage ?? undefined,
        ipAddress: row.ipAddress ?? undefined,
        userAgent: row.userAgent ?? undefined,
    };
}

function hydrateReleases(rows: ReleaseRow[]): Release[] {
    if (rows.length === 0) return [];

    const ids = rows.map((release) => release.id);
    const files = db
        .select()
        .from(releaseFiles)
        .where(inArray(releaseFiles.releaseId, ids))
        .all();

    return rows.map((release) =>
        toRelease(
            release,
            files.filter((file) => file.releaseId === release.id),
        ),
    );
}

export const releasesStore = {
    getAll: (): Release[] => {
        const rows = db
            .select()
            .from(releases)
            .orderBy(desc(releases.createdAt))
            .all();
        return hydrateReleases(rows);
    },

    getById: (id: string): Release | undefined => {
        const release = db
            .select()
            .from(releases)
            .where(eq(releases.id, id))
            .get();
        if (!release) return undefined;

        const files = db
            .select()
            .from(releaseFiles)
            .where(eq(releaseFiles.releaseId, id))
            .all();

        return toRelease(release, files);
    },

    getByVersion: (version: string): Release | undefined => {
        const release = db
            .select()
            .from(releases)
            .where(eq(releases.version, version))
            .get();
        if (!release) return undefined;

        const files = db
            .select()
            .from(releaseFiles)
            .where(eq(releaseFiles.releaseId, release.id))
            .all();

        return toRelease(release, files);
    },

    getLatestEnabled: (
        platform?: Platform,
        options?: { requireUpdateFiles?: boolean },
    ): Release | undefined => {
        const rows = db
            .select()
            .from(releases)
            .where(eq(releases.isEnabled, true))
            .orderBy(desc(releases.createdAt))
            .all();
        const hydrated = hydrateReleases(rows);

        return hydrated.find((release) => {
            if (!platform) return true;
            if (!options?.requireUpdateFiles) return true;

            return hasRequiredUpdateFiles(release, platform);
        });
    },

    create: (input: CreateReleaseInput): Release => {
        const release: ReleaseRow = {
            id: `rel_${generateId()}`,
            version: input.version,
            releaseNotes: input.releaseNotes,
            createdAt: new Date(),
            isEnabled: input.isEnabled ?? false,
        };

        db.insert(releases).values(release).run();
        return toRelease(release);
    },

    update: (id: string, data: UpdateReleaseInput): Release | undefined => {
        const current = releasesStore.getById(id);
        if (!current) return undefined;

        db.update(releases)
            .set({
                version: data.version,
                releaseNotes: data.releaseNotes,
                isEnabled: data.isEnabled,
            })
            .where(eq(releases.id, id))
            .run();

        return releasesStore.getById(id);
    },

    delete: (id: string): boolean => {
        const result = db.delete(releases).where(eq(releases.id, id)).run();
        return result.changes > 0;
    },

    setFile: (
        id: string,
        platform: Platform,
        kind: ReleaseFileKind,
        file: {
            fileName: string;
            fileSize: number;
            storagePath: string;
            contentType: string;
            sha256: string;
            signature: string | null;
            signatureAlgorithm: string | null;
            signedAt: Date | null;
            signingKeyId: string | null;
            downloadUrl: string;
        },
    ): Release | undefined => {
        const release = releasesStore.getById(id);
        if (!release) return undefined;

        db.delete(releaseFiles)
            .where(
                and(
                    eq(releaseFiles.releaseId, id),
                    eq(releaseFiles.platform, platform),
                    eq(releaseFiles.kind, kind),
                ),
            )
            .run();

        db.insert(releaseFiles)
            .values({
                id: `file_${generateId()}`,
                releaseId: id,
                platform,
                kind,
                fileName: file.fileName,
                fileSize: file.fileSize,
                storagePath: file.storagePath,
                contentType: file.contentType,
                sha256: file.sha256,
                signature: file.signature,
                signatureAlgorithm: file.signatureAlgorithm,
                signedAt: file.signedAt,
                signingKeyId: file.signingKeyId,
                downloadUrl: file.downloadUrl,
                downloadCount: 0,
            })
            .run();

        return releasesStore.getById(id);
    },

    getFileRecord: (
        id: string,
        platform: Platform,
        kind: ReleaseFileKind,
    ): ReleaseFileRow | undefined => {
        return db
            .select()
            .from(releaseFiles)
            .where(
                and(
                    eq(releaseFiles.releaseId, id),
                    eq(releaseFiles.platform, platform),
                    eq(releaseFiles.kind, kind),
                ),
            )
            .get();
    },

    incrementDownload: (
        id: string,
        platform: Platform,
        kind: ReleaseFileKind,
    ): boolean => {
        const result = db
            .update(releaseFiles)
            .set({ downloadCount: sql`${releaseFiles.downloadCount} + 1` })
            .where(
                and(
                    eq(releaseFiles.releaseId, id),
                    eq(releaseFiles.platform, platform),
                    eq(releaseFiles.kind, kind),
                ),
            )
            .run();

        return result.changes > 0;
    },

    getStats: () => {
        const totalReleases = db.select().from(releases).all().length;
        const activeReleases = db
            .select()
            .from(releases)
            .where(eq(releases.isEnabled, true))
            .all().length;
        const files = db.select().from(releaseFiles).all();

        return {
            totalReleases,
            activeReleases,
            totalDownloads: files.reduce(
                (sum, file) =>
                    file.kind === "artifact" ? sum + file.downloadCount : sum,
                0,
            ),
            macDownloads: files
                .filter(
                    (file) => file.platform === "mac" && file.kind === "artifact",
                )
                .reduce((sum, file) => sum + file.downloadCount, 0),
            windowsDownloads: files
                .filter(
                    (file) =>
                        file.platform === "windows" && file.kind === "artifact",
                )
                .reduce((sum, file) => sum + file.downloadCount, 0),
        };
    },
};

const requiredKindsByPlatform: Record<Platform, ReleaseFileKind[]> = {
    mac: ["metadata", "artifact", "blockmap"],
    windows: ["metadata", "artifact", "blockmap"],
};

function hasRequiredUpdateFiles(
    release: Release,
    platform: Platform,
): boolean {
    return requiredKindsByPlatform[platform].every((kind) =>
        release.files.some(
            (file) => file.platform === platform && file.kind === kind,
        ),
    );
}

export const logsStore = {
    getAll: (filters?: LogFilters): UpdateLog[] => {
        const conditions = [];

        if (filters?.platform) {
            conditions.push(eq(updateLogs.platform, filters.platform));
        }
        if (filters?.status) {
            conditions.push(eq(updateLogs.status, filters.status));
        }
        if (filters?.version) {
            conditions.push(
                or(
                    eq(updateLogs.toVersion, filters.version),
                    eq(updateLogs.fromVersion, filters.version),
                ),
            );
        }
        if (filters?.startDate) {
            conditions.push(gte(updateLogs.timestamp, filters.startDate));
        }
        if (filters?.endDate) {
            conditions.push(lte(updateLogs.timestamp, filters.endDate));
        }

        const rows = db
            .select()
            .from(updateLogs)
            .where(conditions.length ? and(...conditions) : undefined)
            .orderBy(desc(updateLogs.timestamp))
            .all();

        return rows.map(toUpdateLog);
    },

    create: (
        input: CreateLogInput,
        headers?: { ipAddress?: string; userAgent?: string },
    ): UpdateLog => {
        const log: UpdateLogRow = {
            id: `log_${generateId()}`,
            timestamp: new Date(),
            clientId: input.clientId,
            fromVersion: input.fromVersion,
            toVersion: input.toVersion,
            platform: input.platform,
            status: input.status,
            errorMessage: input.errorMessage ?? null,
            ipAddress: headers?.ipAddress ?? null,
            userAgent: headers?.userAgent ?? null,
        };

        db.insert(updateLogs).values(log).run();
        return toUpdateLog(log);
    },

    getStats: () => {
        const logs = db.select().from(updateLogs).all();

        return {
            total: logs.length,
            successful: logs.filter((log) => log.status === "installed").length,
            failed: logs.filter((log) => log.status === "failed").length,
            inProgress: logs.filter(
                (log) => log.status === "started" || log.status === "downloaded",
            ).length,
        };
    },
};
